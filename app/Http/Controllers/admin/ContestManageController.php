<?php

namespace App\Http\Controllers\admin;

use App\Http\Controllers\Controller;
use App\Models\Entry;
use App\Models\Review;
use App\Models\Vote;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\Contest;
use App\Models\ContestCategory;
use App\Models\User;
use App\Models\Winner;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ContestManageController extends Controller
{


    /***
     * Contest Category Management Functions
     * Create a new contest category
     */

    public function contestCategoryCreate(Request $request )
    {
        $parentCategories = \App\Models\ContestCategory::whereNull('parent_id')->get();
        return inertia('Contest/Category/Create', [
            'categories' => $parentCategories
        ]);
    }
    /***
     * Store a newly created contest category in storage.
     */
    public function contestCategoryStore(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:contest_categories,name',
            'description' => 'nullable|string|max:1000',
            'parent_id' => 'nullable|exists:contest_categories,id',
        ]);

        ContestCategory::create([
            'name' => $request->name,
            'slug' => Str::slug($request->name).'-'.uniqid(),
            'description' => $request->description,
            'parent_id' => $request->parent_id,
        ]);

        return to_route('admin.contest.category.index')
            ->with('success', 'Category created successfully.');
    }

     /***
     * Contest Category Management Functions
     * Show contest category
     */

    public function contestCategoryIndex(Request $request)
    {
        $categories = ContestCategory::when($request->filled('search'), fn($q) => $q->search($request->search))
                    ->orderByDesc('id')
                    ->paginate($request->get('per_page', 10))
                    ->withQueryString();

        return inertia('Contest/Category/Index', [
            'categories' => $categories,
            'filters' => $request->only(['search']),
        ]);

    }


    //delete reviews 

    public function reviewDestroy($id)
    {
        $review = Review::findOrFail($id);
        $review->delete();

        return to_route('admin.reviews.index')
            ->with('success', 'Review deleted successfully.');
    }


    /**
     * delete contest category
     * 
     */


    public function contestCategoryDestroy($id)
    {
        $category = ContestCategory::findOrFail($id);
        $category->delete();

        return to_route('admin.contest.category.index')
            ->with('success', 'Category deleted successfully.');
    }

    /***
     * Contest Entry Management Functions
     * Show the form for creating a new contest entry
     */

    public function entryIndex(Request $request, String $id)
    {
        try {
            $contest = Contest::findOrFail($id);
            $entries = Entry::with(['winner', 'user', 'votes', 'review'])
                ->where('contest_id', $id)
                ->when($request->filled('search'), fn($q) => $q->search($request->search))
                ->when($request->filled('status'), fn($q) => $q->where('status', $request->status))
                ->withCount(['review']) // Add this line to get review count
                ->orderBy('total_votes', 'desc')
                ->orderBy('created_at', 'desc')
                ->paginate(10)
                ->withQueryString();

            $user = User::find(Auth::id());
            $userVotes = $user->votes()->pluck('entry_id')->toArray();

            // Get contest details
            $contestDetails = [
                'id' => $contest->id,
                'title' => $contest->title,
                'description' => $contest->description,
                'start_date' => $contest->start_date,
                'end_date' => $contest->end_date,
                'status' => $contest->status,
                'total_prize_positions' => $contest->prizes->count(),
            ];

            return Inertia::render('Contest/EntryList', [
                'entries' => $entries,
                'contest' => $contestDetails,
                'userVotes' => $userVotes,
                'filters' => $request->only(['search', 'status', 'sort']),
                'stats' => [
                    'total_entries' => $entries->total(),
                    'total_votes' => $entries->sum('total_votes'),
                    'winners_count' => $entries->where('winner', '!=', null)->count(),
                    'user_votes_count' => count($userVotes),
                ]
            ]);

        } catch (ModelNotFoundException $e) {
            return redirect()
                ->route('admin.contests.index')
                ->with('error', 'Contest not found.');
                
        } catch (\Exception $e) {
            Log::error('Error fetching contest entries: ' . $e->getMessage(), [
                'contest_id' => $id,
                'user_id' => Auth::id(),
                'ip' => $request->ip()
            ]);

            return redirect()
                ->back()
                ->with('error', 'An error occurred while loading contest entries. Please try again.');
        }
    }

    

    //votes store
    public function voteStore(Request $request)
    {
        $request->validate([
            'entry_id' => 'required|exists:entries,id',
        ]);

        $userId = auth()->id() ?? $request->user_id; 
        $existingVote = Vote::where('entry_id', $request->entry_id)
                            ->where('user_id', $userId)
                            ->first();

        if ($existingVote) {
            return back()->with('error', 'You have already voted for this entry.');
        }

        $vote = Vote::create([
            'entry_id' => $request->entry_id,
            'user_id' => $userId,
        ]);

        if($vote){
            Entry::where('id', $request->entry_id)->increment('total_votes');
            return back()->with('success', 'Vote recorded successfully.');
        } else {
            return back()->with('error', 'Failed to record vote. Please try again.');
        }

    }


    //vote index page
    public function voteIndex()
    {
        $votes = Vote::with(['entry', 'user'])->get();
        return inertia('Contest/Vote/Index', compact('votes'));
    }

    //vote delete function can be added here
    public function voteDestroy($id)
    {
        $vote = Vote::findOrFail($id);
        Entry::where('id', $vote->entry_id)->where('user_id', $vote->user_id)->decrement('total_votes');
        $vote->delete();
        return back()->with('success', 'Vote deleted successfully.');
    }



    //winner all functions can be added here
    public function determineWinner($contestId)
    {
        $contest = Contest::with('entries')->findOrFail($contestId);
        $topEntry = $contest->entries()->orderByDesc('total_votes')->first();

        if(!$topEntry) {
            return back()->with('error', 'No entries found for this contest.');
        }

        Winner::updateOrCreate(
            ['contest_id' => $contest->id],
            [
                'entry_id' => $topEntry->id,
                'type' => 'auto'
            ]
        );

        return back()->with('success', 'Winner determined automatically: ' . $topEntry->title);
    }
    


    //set manual winner function
    public function setManualWinner(Request $request, $entryId)
    {
        $entry = Entry::with(['contest', 'user', 'review'])->findOrFail($entryId);
        $contest = $entry->contest;

        $alreadyWinner = Winner::where('contest_id', $contest->id)
            ->where('entry_id', $entryId)
            ->exists();

        if ($alreadyWinner) {
            return back()->withErrors(['error' => 'This entry has already been declared a winner.']);
        }

        $lastPosition = Winner::where('contest_id', $contest->id)->max('position');
        $nextPosition = $lastPosition ? $lastPosition + 1 : 1;

        Winner::create([
            'contest_id' => $contest->id,
            'entry_id' => $entryId,
            'type' => 'manual',
            'position' => $nextPosition,
        ]);

        return back()->with('success', "Winner manually set successfully for position #{$nextPosition}.");
    }


    //winner index function
    public function winnerDeclear($entryId)
    {
        $entry = Entry::with(['contest', 'user', 'review'])->findOrFail($entryId);
        $contest = $entry->contest;

        $alreadyWinner = Winner::where('contest_id', $contest->id)
            ->where('entry_id', $entry->id)
            ->exists();

        if ($alreadyWinner) {
            return back()->withErrors(['error' => 'This entry has already been declared a winner.']);
        }

        $entriesRanked = Entry::where('contest_id', $contest->id)
            ->orderByDesc('total_votes')
            ->get();

        $position = 1;
        foreach ($entriesRanked as $rankedEntry) {
            if ($rankedEntry->id === $entry->id) {
                break;
            }
            $position++;
        }

        Winner::create([
            'contest_id' => $contest->id,
            'entry_id' => $entry->id,
            'type' => 'manual',
            'position' => $position,
        ]);

        return back()->with('success', 'Winner declared successfully: ' . $entry->title . ' (Position: ' . $position . ')');
    }






    //prize index page
    public function prizeIndex(Request $request)
    {
        $query = \App\Models\Prize::with(['contests','winner']);

        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('position', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Pagination
       $prizes = $query->paginate($request->get('per_page', 10))->withQueryString(); 

        return Inertia::render('Contest/Prize/Index', [
            'prizes' => $prizes,
            'filters' => $request->only(['search']),
        ]);

    }



    // prize create page
    public function prizeCreate()
    {
        $contests = \App\Models\Contest::running()->get();
        return inertia('Contest/Prize/Create', compact('contests'));
    }



    // Prize store function for multiple prizes
    public function prizeStore(Request $request)
    {

        $request->validate([
            'prizes' => 'required|array|min:1',
            'prizes.*.position' => 'required|string|max:255',
            'prizes.*.amount_normal_user' => 'required|numeric|min:0',
            'prizes.*.amount_premium_user' => 'required|numeric|min:0',
            'prizes.*.description' => 'nullable|string|max:1000',
        ]);

        $createdPrizes = [];
        $errors = [];

        foreach ($request->prizes as $index => $prizeData) {
            try {

                $prize = \App\Models\Prize::create([
                    'position' => $prizeData['position'],
                    'amount_normal_user' => $prizeData['amount_normal_user'],
                    'amount_premium_user' => $prizeData['amount_premium_user'],
                    'description' => $prizeData['description'],
                ]);

                $createdPrizes[] = $prize;

            } catch (\Exception $e) {
                $errors[] = "Failed to create prize #" . ($index + 1) . ": " . $e->getMessage();
            }
        }

        if (!empty($errors)) {
            foreach ($createdPrizes as $prize) {
                $prize->delete();
            }

            return back()->withErrors(['prize_creation' => $errors]);
        }

        $message = count($createdPrizes) > 1 
            ? count($createdPrizes) . ' prizes created successfully.' 
            : 'Prize created successfully.';

        return to_route('admin.prizes.index')->with('success', $message);
    }


    //prize show function
    public function prizeShow($id)
    {
        $prize = \App\Models\Prize::with(['contests','winner'])->findOrFail($id);
        return inertia('Contest/Prize/Show', compact('prize'));
    }



    //archive index function can be added here
    // public function archivedIndex()
    // {
    //     $archivedContests = \App\Models\Contest::with(['creator', 'category','prizes'])->where('status', Contest::STATUS_ENDED)
    //     ->get();
    //     return inertia('Contest/Archived/Index', compact('archivedContests'));
    // }

    public function archivedContestIndex(Request $request)
    {
        $contests = Contest::with(['creator', 'prizes','entries','reviews','category'])
                    ->where('status', Contest::STATUS_ENDED)
                    ->when($request->filled('search'), fn($q) => $q->search($request->search))
                    ->when($request->filled('status'), fn($q) => $q->status($request->status))
                    ->orderByDesc('id')
                    ->paginate($request->get('per_page', 10))
                    ->withQueryString();

        return Inertia::render('Contest/Archived/Index', [
            'contests' => $contests,
            'filters' => $request->only(['search', 'status']),
        ]);
    }
 

    //archive create function can be added here
    public function archivedCreate()
    {
        $contests = Contest::where('status', '!=', Contest::STATUS_ARCHIVED)->get();
        return inertia('Contest/Archived/Create', compact('contests'));
    }



    //archive store function can be added here
    public function archivedStore(Request $request)
    {
       $request->validate([
            'contest_id' => 'required|exists:contests,id',
            'summary' => 'required|string|max:1000',
        ]);

        $data = \App\Models\ArchivedContest::create([
            'contest_id' => $request->contest_id,
            'summary' => $request->summary,
            'archived_at' => now(),
        ]);

        if ($data) {
            \App\Models\Contest::where('id', $request->contest_id)
                ->update(['status' => '4']); // Assuming '4' = archived
        }

        return to_route('admin.archived.index')->with('success', 'Contest archived successfully.');
    }



    //reviewStore function can be added here
    public function reviewStore(Request $request)
    {
        $request->validate([
            'entry_id' => 'nullable|exists:entries,id',
            'contest_id' => 'nullable|exists:contests,id',
            'comment' => 'nullable|string|max:1000',
            'rating' => 'required|integer|min:1|max:5',
        ]);

        Review::create([
            'entry_id' => $request->entry_id ?? null,
            'contest_id' => $request->contest_id ?? null,
            'reviewed_by' => Auth::id(),
            'decision' => Review::STATUS_APPROVED,
            'comment' => $request->comment,
            'rating' => $request->rating ?? null,
        ]);

        return back()->with('success', 'Review submitted successfully.');
    }


    //review index function can be added here
    public function reviewIndex()
    {
        $reviews = \App\Models\Review::with(['entry', 'contest', 'reviewer'])
            ->when(request('search'), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('comments', 'like', "%{$search}%")
                    ->orWhereHas('entry', function ($q2) use ($search) {
                        $q2->where('title', 'like', "%{$search}%");
                    })
                    ->orWhereHas('contest', function ($q3) use ($search) {
                        $q3->where('title', 'like', "%{$search}%");
                    })
                    ->orWhereHas('reviewer', function ($q4) use ($search) {
                        $q4->where('name', 'like', "%{$search}%");
                    });
                });
            })
            ->latest()
            ->paginate(10);

        return inertia('Contest/Review/Index', compact('reviews'));
    }



    //contest review functiion can be added here

    public function contestReviewIndex(Request $request, String $id)
    {
        $reviews = \App\Models\Review::with(['entry', 'contest', 'reviewer'])
            ->where('contest_id', $id)
            ->when(request('search'), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('comments', 'like', "%{$search}%")
                    ->orWhereHas('reviewer', function ($q4) use ($search) {
                        $q4->where('name', 'like', "%{$search}%");
                    });
                });
            })
            ->latest()
            ->paginate(10);

        return inertia('Contest/Reviews', compact('reviews'));
    }


    //contest holded function can be added here
    public function contestHolded(Request $request, $id)
    {
        $contest = Contest::findOrFail($id);
        $contest->voting_enabled = 0;
        $contest->admin_approval = 0;
        $contest->save();

        return to_route('admin.contests.index')->with('success', 'Contest has been put on hold successfully.');
    }

    //contest active function can be added here
    public function contestActive(Request $request, $id)
    {
        $contest = Contest::findOrFail($id);

        if($contest->end_date && now()->greaterThan($contest->end_date)) {
            return to_route('admin.contests.index')->withErrors('error', 'Cannot activate an ended contest.');
        }

        $contest->voting_enabled = 1;
        $contest->admin_approval = 1;
        $contest->status = Contest::STATUS_RUNNING;
        $contest->save();
        return to_route('admin.contests.index')->with('success', 'Contest has been activated successfully.');
    }


    //entry review functiion can be added here
    public function entryReviewIndex(Request $request, String $id)
    {
        $reviews = \App\Models\Review::with(['entry', 'contest', 'reviewer'])
            ->where('entry_id', $id)
            ->when(request('search'), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('comments', 'like', "%{$search}%")
                    ->orWhereHas('reviewer', function ($q4) use ($search) {
                        $q4->where('name', 'like', "%{$search}%");
                    });
                });
            })
            ->latest()
            ->paginate(10);

        return inertia('Contest/Entry/Reviews', compact('reviews'));
    }



    //review edit function can be added here
    public function reviewEdit($id)
    {
        $review = \App\Models\Review::with(['entry','reviewer'])->findOrFail($id);
        return inertia('Contest/Review/Edit', compact('review'));
    }


    //review update function can be added here
    public function reviewUpdate(Request $request, $id)
    {
         $request->validate([
            'comments' => 'nullable|string|max:1000',
            'decision' => 'required|in:1,2',
        ]);

        $review = Review::findOrFail($id);

        if ($review->reviewed_by !== Auth::id()) {
            return response()->json(['error' => 'Unauthorized.'], 403);
        }

        $review->update([
            'comments' => $request->comments,
            'decision' => $request->decision,
        ]);

        return to_route('admin.reviews.index')->with('success', 'Review updated successfully.');

    }


    public function bulkSetManualWinners(Request $request)
    {
        $request->validate([
            'contest_id' => 'required|exists:contests,id',
            'entry_ids' => 'required|array|min:1',
            'entry_ids.*' => 'exists:entries,id',
        ]);

        $contest = Contest::findOrFail($request->contest_id);
        $entryIds = $request->entry_ids;

        $alreadyWinners = Winner::where('contest_id', $contest->id)
            ->pluck('entry_id')
            ->toArray();

        $successfulCount = 0;
        $errors = [];

        foreach ($entryIds as $entryId) {
            if (in_array($entryId, $alreadyWinners)) {
                $errors[] = "Entry #{$entryId} is already a winner.";
                continue;
            }

            $lastPosition = Winner::where('contest_id', $contest->id)->max('position');
            $nextPosition = $lastPosition ? $lastPosition + 1 : 1;

            Winner::create([
                'contest_id' => $contest->id,
                'entry_id' => $entryId,
                'type' => 'manual',
                'position' => $nextPosition,
            ]);

            $alreadyWinners[] = $entryId;
            $successfulCount++;
        }

        if ($successfulCount > 0) {
            $message = "{$successfulCount} winner(s) declared successfully.";
            if (!empty($errors)) {
                $message .= " Some entries skipped: " . implode(' ', $errors);
            }
            return back()->with('success', $message);
        }

        return back()->withErrors(['error' => implode(' ', $errors) ?: 'No winners could be declared.']);
    }

}
