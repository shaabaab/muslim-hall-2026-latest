<?php

namespace App\Http\Controllers\user;

use App\Http\Controllers\Controller;
use App\Http\Requests\user\StoreEntryRequest;
use App\Models\Contest;
use App\Models\Entry;
use App\Models\EntryImage;
use App\Models\Review;
use App\Models\User;
use App\Models\Vote;
use App\Services\EntryService;
use App\Services\ServiceClass;
use Carbon\Carbon;
use Dotenv\Util\Str;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ContestManageUserController extends Controller
{
    //index function to list contests

    protected EntryService $entryService;

    public function __construct(EntryService $entryService)
    {
        $this->entryService = $entryService;
    }


    public function index(Request $request)
    {
        $contests = Contest::with(['creator', 'prizes'])
            ->running()
            ->where('voting_enabled', Contest::CONTEST_ENABLED)
            ->when($request->filled('search'), fn($q) => $q->search($request->search))
            ->when($request->filled('status'), fn($q) => $q->where('status', $request->status))
            ->orderByDesc('id')
            ->paginate($request->get('per_page', 10))
            ->withQueryString();

        return Inertia::render('UserNavSection/Contest/Index', [
            'contests' => $contests,
            'filters' => $request->only(['search', 'status', 'per_page']),
        ]);
    }



    public function historyContest(Request $request)
    {
        $entryHistory = Entry::with(['contest', 'user', 'review', 'winner'])
            ->where('user_id', Auth::id())
            ->when($request->filled('search'), fn($q) => $q->search($request->search))
            ->when($request->filled('status'), fn($q) => $q->where('status', $request->status))
            ->orderByDesc('id')
            ->paginate($request->get('per_page', 10))
            ->withQueryString();

        return Inertia::render('UserNavSection/Contest/History', [
            'entryHistory' => $entryHistory,
            'filters' => $request->only(['search', 'status', 'per_page']),
        ]);
    }



    //getEntry function can be here
    public function getEntry(Request $request, string $id)
    {
        try {
            $contest = Contest::with(['votes', 'entries'])->findOrFail($id);


            // $isEntry = Entry::where('contest_id', $id)
            //     ->where('user_id', Auth::id())
            //     ->exists();

            // if (!$isEntry) {
            //     return redirect()
            //         ->back()
            //         ->withErrors(['error' => 'You need to participate in the contest first to view entries.']);
            // }

            $entries = Entry::with(['winner', 'user', 'votes', 'reviews'])
                ->where('contest_id', $id)
                // ->where('status',Entry::STATUS_APPROVED)
                // ->where('user_id', '!=', Auth::id())
                ->when($request->filled('search'), fn($q) => $q->search($request->search))
                ->when($request->filled('status'), fn($q) => $q->where('status', $request->status))
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

            return Inertia::render('UserNavSection/Contest/ContestEntry', [
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
                ->route('user.contests.index')
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
    public function voteStore($entryId)
    {

        $userId = auth()->id();
        $contestId = Entry::where('id', $entryId)->value('contest_id');

        $existingVote = Vote::where('user_id', $userId)
            ->where('contest_id', $contestId)
            ->exists();

        if ($existingVote) {
            return back()->withErrors(['error' => 'You have already voted for this Contest.']);
        }

        $vote = Vote::create([
            'entry_id' => $entryId,
            'user_id' => $userId,
            'contest_id' => $contestId,
        ]);

        if ($vote) {
            Entry::where('id', $entryId)->increment('total_votes');
            return back()->with('success', 'Vote recorded successfully.');
        } else {
            return back()->with('error', 'Failed to record vote. Please try again.');
        }
    }





    public function show($id)
    {
        $contest = Contest::with(['prizes', 'entries', 'entries.reviews'])->findOrFail($id);
        $isEntrySubmitted = $contest->entries()->where('status', Entry::STATUS_APPROVED)->where('user_id', Auth::id())->exists();

        return Inertia::render('UserNavSection/Contest/Show', [
            'contest' => $contest,
            'isEntrySubmitted' => $isEntrySubmitted,
        ]);
    }



    public function createEntry($id)
    {
        $contest = Contest::findOrFail($id);
        $contest->formats = $contest->formats ? json_decode($contest->formats) : [];
        $user = User::find(Auth::id());
        $isMember = $user ? $user->subscriptions()->exists() : false;
        return Inertia::render('UserNavSection/Contest/Entry/Create', [
            'contest' => $contest,
            'isMember' => $isMember,
        ]);
    }

    public function editEntry($id)
    {
        $entry = Entry::with(['contest', 'images'])
            ->where('id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $contest = $entry->contest;
        $contest->formats = $contest->formats ? json_decode($contest->formats) : [];


        return Inertia::render('UserNavSection/Contest/Entry/Edit', [
            'entry' => $entry,
            'contest' => $contest,
        ]);
    }



    public function entryUpdate(Request $request, string $id)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'nullable|string|max:1000',

            'thumbnail' => 'nullable|file',
            'video'     => 'nullable|file',
            'audio'     => 'nullable|file',
            'pdf'       => 'nullable|file',
            
            'video_temp_path' => 'nullable|string',
            'audio_temp_path' => 'nullable|string',
            'pdf_temp_path'   => 'nullable|string',

            'remove_thumbnail' => 'nullable|boolean',
            'remove_video'     => 'nullable|boolean',
            'remove_audio'     => 'nullable|boolean',
            'remove_pdf'       => 'nullable|boolean',
        ]);

        $entry = \App\Models\Entry::findOrFail($id);

        // -------- REMOVE OLD --------

        if ($request->boolean('remove_thumbnail')) {
            ServiceClass::deleteFile($entry->thumbnail);
            $entry->thumbnail = null;
        }

        if ($request->boolean('remove_video')) {
            ServiceClass::deleteFile($entry->video);
            $entry->video = null;
        }

        if ($request->boolean('remove_audio')) {
            ServiceClass::deleteFile($entry->audio);
            $entry->audio = null;
        }

        if ($request->boolean('remove_pdf')) {
            ServiceClass::deleteFile($entry->pdf);
            $entry->pdf = null;
        }

        $videoPath = $entry->video;
        $audioPath = $entry->audio;
        $pdfPath   = $entry->pdf;

        // -------- REPLACE --------

        if ($request->hasFile('thumbnail')) {
            $entry->thumbnail = ServiceClass::updateFile(
                $request->file('thumbnail'),
                'entries/thumbnail',
                $entry->thumbnail
            );
        }

        if ($request->hasFile('video')) {
            if ($entry->video && $entry->video !== 'processing') {
                ServiceClass::deleteFile($entry->video);
            }
            $videoPath = ServiceClass::uploadLargeFile($request->file('video'), 'entries/video', 'entries', 'video', $entry->id);
        } elseif ($request->filled('video_temp_path')) {
            if ($entry->video && $entry->video !== 'processing') {
                ServiceClass::deleteFile($entry->video);
            }
            $videoPath = ServiceClass::dispatchLargeFileJob($request->video_temp_path, 'entries/video', 'entries', 'video', $entry->id);
        }

        if ($request->hasFile('audio')) {
            if ($entry->audio && $entry->audio !== 'processing') {
                ServiceClass::deleteFile($entry->audio);
            }
            $audioPath = ServiceClass::uploadLargeFile($request->file('audio'), 'entries/audio', 'entries', 'audio', $entry->id);
        } elseif ($request->filled('audio_temp_path')) {
            if ($entry->audio && $entry->audio !== 'processing') {
                ServiceClass::deleteFile($entry->audio);
            }
            $audioPath = ServiceClass::dispatchLargeFileJob($request->audio_temp_path, 'entries/audio', 'entries', 'audio', $entry->id);
        }

        if ($request->hasFile('pdf')) {
            if ($entry->pdf && $entry->pdf !== 'processing') {
                ServiceClass::deleteFile($entry->pdf);
            }
            $pdfPath = ServiceClass::uploadLargeFile($request->file('pdf'), 'entries/pdf', 'entries', 'pdf', $entry->id);
        } elseif ($request->filled('pdf_temp_path')) {
            if ($entry->pdf && $entry->pdf !== 'processing') {
                ServiceClass::deleteFile($entry->pdf);
            }
            $pdfPath = ServiceClass::dispatchLargeFileJob($request->pdf_temp_path, 'entries/pdf', 'entries', 'pdf', $entry->id);
        }




        if ($request->filled('remove_images')) {
            $imagesToRemove = EntryImage::where('entries_id', $entry->id)
                ->whereIn('id', $request->remove_images)
                ->get();

            foreach ($imagesToRemove as $img) {
                ServiceClass::deleteFile($img->image);  // column is 'image' not 'image_path'
                $img->delete();
            }
        }

        // ── Add new gallery images ─────────────────────────────────────────
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $path = ServiceClass::uploadFile($image, 'entries/gallery');
                EntryImage::create(['entries_id' => $entry->id, 'image' => $path]);  // correct columns
            }
        }




        // -------- BASIC UPDATE --------

        $entry->update([
            'user_id' => Auth::id(),
            'title'   => $validated['title'],
            'content' => $validated['content'] ?? null,
            'thumbnail' => $entry->thumbnail,
            'video'     => $videoPath,
            'audio'     => $audioPath,
            'pdf'       => $pdfPath,
        ]);

        // Determine success message
        $hasLargeFiles = $request->hasFile('video') || $request->filled('video_temp_path') || 
                         $request->hasFile('audio') || $request->filled('audio_temp_path') || 
                         $request->hasFile('pdf') || $request->filled('pdf_temp_path');
        $successMsg = $hasLargeFiles
            ? 'Entry updated. Large files (video/audio/pdf) are being uploaded in the background.'
            : 'Entry updated successfully.';

        return to_route('user.own_entry.index')
            ->with('success', $successMsg);
    }



    public function indexEntry(Request $request)
    {
        $entries = Entry::with('contest')
            ->where('user_id', Auth::id())
            ->when($request->filled('search'), fn($q) => $q->search($request->search))
            ->when($request->filled('status'), fn($q) => $q->where('status', $request->status))
            ->orderByDesc('id')
            ->paginate($request->get('per_page', 10))
            ->withQueryString();

        return Inertia::render('UserNavSection/Contest/Entry/Index', [
            'entries' => $entries,
            'filters' => $request->only(['search', 'status', 'per_page']),
        ]);
    }


    public function showEntry(string $id)
    {
        $entry = \App\Models\Entry::with(['user', 'contest', 'votes', 'images'])->findOrFail($id);
        return inertia('UserNavSection/Contest/Entry/Show', compact('entry'));
    }




    public function storeEntry(StoreEntryRequest $request, $id)
    {
        $contest = Contest::findOrFail($id);
        try {
            $data = $request->validated();


            // dd([
            //     'contest_formats' => $contest->formats,
            //     'all' => $request->all(),
            //     'files' => $request->allFiles(),
            //     'validated' => $request->validated(),
            //     'has_thumbnail' => $request->hasFile('thumbnail'),
            //     'has_video' => $request->hasFile('video'),
            //     'has_audio' => $request->hasFile('audio'),
            //     'has_pdf' => $request->hasFile('pdf'),
            // ]);
            // dd($request->all(), $request->file());
            $data['thumbnail'] = $request->file('thumbnail');
            $data['video']     = $request->file('video');
            $data['audio']     = $request->file('audio');
            $data['pdf']       = $request->file('pdf');
            $data['video_temp_path'] = $request->video_temp_path;
            $data['audio_temp_path'] = $request->audio_temp_path;
            $data['pdf_temp_path']   = $request->pdf_temp_path;


            $data['images']    = $request->file('images');

            $this->entryService->store($contest, $data);


            return redirect()->route('user.own_entry.index')
                ->with('success', 'Entry submitted successfully');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function storeContestEntry(StoreEntryRequest $request)
    {
        $contest = Contest::findOrFail($request->contest_id);
        try {
            $this->entryService->store($contest, $request->validated());
            return response()->json(['success' => 'Entry submitted successfully!']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }


    //vote history
    public function voteHistory($entryId, Request $request)
    {
        $voteHistory = Vote::with('user')->when($request->filled('search'), fn($q) => $q->search($request->search))
            ->where('entry_id', $entryId)
            ->orderByDesc('created_at')
            ->paginate($request->get('per_page', 10))
            ->withQueryString()
            ->through(function ($vote) {
                return [
                    'id' => $vote->id,
                    'user' => $vote->user ? [
                        'id' => $vote->user->id,
                        'name' => $vote->user->name,
                        'email' => $vote->user->email,
                    ] : null,
                    'score' => $vote->score,
                    'created_at' => Carbon::parse($vote->created_at),
                    'created_at_formatted' => Carbon::parse($vote->created_at)->format('M j, Y g:i A'),
                ];
            });

        return Inertia::render('UserNavSection/Contest/Entry/VoteHistory', [
            'entryId' => (int) $entryId,
            'voteHistory' => $voteHistory,
            'filters' => $request->only(['search', 'per_page']),
        ]);
    }

    //review history
    public function reviewHistory($entryId, Request $request)
    {
        $reviewHistory = Review::with('reviewer')->when($request->filled('search'), fn($q) => $q->search($request->search))
            ->where('entry_id', $entryId)
            ->orderByDesc('created_at')
            ->paginate($request->get('per_page', 10))
            ->withQueryString()
            ->through(function ($review) {
                return [
                    'id' => $review->id,
                    'reviewer' => $review->reviewer ? [
                        'id' => $review->reviewer->id,
                        'name' => $review->reviewer->name,
                        'email' => $review->reviewer->email,
                    ] : null,
                    'rating' => $review->rating,
                    'comments' => $review->comments,
                    'created_at' => Carbon::parse($review->created_at),
                    'created_at_formatted' => Carbon::parse($review->created_at)->format('M j, Y g:i A'),
                ];
            });

        return Inertia::render('UserNavSection/Contest/Entry/reviewHistory', [
            'entryId' => (int) $entryId,
            'reviewHistory' => $reviewHistory,
            'filters' => $request->only(['search', 'per_page']),
        ]);
    }


    //store review
    public function storeReview(Request $request)
    {
        $request->validate([
            'contest_id' => 'required|exists:contests,id',
            'rating' => 'required|integer|min:1|max:5',
            'review' => 'nullable|string|max:1000',
            'decision' => 'required|in:1,2',
        ]);

        $contestId = $request->input('contest_id');
        $user = User::find(Auth::id());

        $existingReview = $user->reviewsGiven()->where('contest_id', $contestId)->first();
        if ($existingReview) {
            return response()->json(['error' => 'You have already reviewed this contest.'], 400);
        }

        // Create a new review
        $user->reviewsGiven()->create([
            'contest_id' => $contestId,
            'rating' => $request->input('rating'),
            'comments' => $request->input('review'),
            'decision' => $request->decision ?? Review::STATUS_APPROVED,
            'entry_id' => null,
            'reviewed_by ' => $user->id,
        ]);

        return response()->json(['success' => 'Review submitted successfully!']);
    }

    // store review for contest entry

    public function storeReviewEntry(Request $request, string $id)
    {


        $entryId = Entry::where('id', $id)->value('id');
        $user = User::find(Auth::id());

        $existingReview = $user->reviewsGiven()->where('entry_id', $entryId)->exists();


        if ($existingReview) {
            return back()->withErrors(['error' => 'You have already reviewed this contest entry.']);
        }

        // Create a new review
        $user->reviewsGiven()->create([
            'contest_id' => null,
            'rating' => $request->input('rating'),
            'comments' => $request->input('comment'),
            'decision' => Review::STATUS_APPROVED,
            'entry_id' => $entryId,
            'reviewed_by' => $user->id,
        ]);

        return back()->withSuccess(['success' => 'Review submitted successfully!']);
    }


    // Contest Fee page — shows deposit + transaction history
    public function contestFees(Request $request)
    {
        $user = User::find(Auth::id());

        $fees = \App\Models\ContestFee::with('contest')
            ->where('user_id', Auth::id())
            ->when($request->filled('search'), fn($q) => $q->whereHas('contest', fn($c) => $c->where('title', 'like', '%' . $request->search . '%')))
            ->orderByDesc('created_at')
            ->paginate($request->get('per_page', 10))
            ->withQueryString();

        return Inertia::render('UserNavSection/Contest/ContestFee', [
            'fees'    => $fees,
            'deposit' => $user->deposit ?? 0,
            'filters' => $request->only(['search', 'per_page']),
        ]);
    }
    public function disqualify(Entry $entry)
    {
        $entry->update(['is_disqualified' => true]);

        return back()->with('success', 'Entry disqualified successfully.');
    }
}
