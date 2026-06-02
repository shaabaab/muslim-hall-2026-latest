<?php

namespace App\Http\Controllers\user;

use App\Http\Controllers\Controller;
use App\Http\Requests\UserContestStore;
use App\Http\Requests\UserContestUpdate;
use Illuminate\Http\Request;
use App\Models\Contest;
use App\Models\ContestCategory;
use App\Models\ContestSponsor;
use App\Models\Entry;
use App\Models\Prize;
use App\Models\Sponsor;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class ContestController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = User::find(Auth::id());
        $isMember = $user->subscriptions()->where('status', Subscription::STATUS_ACTIVE)->exists();
        abort_if(!$isMember, 403, 'Access denied. You must be a member to show contests.');

        $contests = Contest::with(['creator', 'prizes', 'entries', 'reviews', 'category', 'contestSponsor'])
            ->when($request->filled('search'), fn($q) => $q->search($request->search))
            ->when($request->filled('status'), fn($q) => $q->status($request->status))
            ->where('created_by', auth()->id())
            ->orderByDesc('id')
            ->paginate($request->get('per_page', 10))
            ->withQueryString();

        return Inertia::render('UserNavSection/OwnContest/Index', [
            'contests' => $contests,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $user = User::find(Auth::id());
        $isMember = $user->subscriptions()->where('status', Subscription::STATUS_ACTIVE)->exists();
        abort_if(!$isMember, 403, 'Access denied. You must be a member to create contests.');

        $prizePoll = Prize::all();
        $category = ContestCategory::all();
        $sponsor = Sponsor::where('user_id', Auth::id())->get();

        return inertia('UserNavSection/OwnContest/Create', [
            'prizes' => $prizePoll,
            'categories' => $category,
            'sponsors' => $sponsor
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(UserContestStore $request)
    {
        $validated = $request->validated();
        $validated['created_by'] = auth()->id();
        // $validated['status'] = Contest::STATUS_UPCOMING;

        $validated['type'] = $request->type;
        $validated['formats'] = !empty($request->formats) ? json_encode($request->formats) : null;
        $validated['form_url'] = $request->form_url;
        $contest = Contest::create($validated);
        $contest->prizes()->sync($request->prizes);
        // dd($request->all());
        if ($request->sponsor_ids) {
            $sponsorData = [];
            foreach ($request->sponsor_ids as $sponsorId) {
                if (isset($request->sponsor_banners[$sponsorId]['file'])) {
                    $bannerFile = $request->sponsor_banners[$sponsorId]['file'];

                    $bannerPath = $bannerFile->store(
                        'contest-banners/' . $contest->id,
                    );

                    $sponsorData[] = [
                        'sponsor_id' => $sponsorId,
                        'contest_id' => $contest->id,
                        'banner' => $bannerPath,
                    ];
                }
            }
            $contest->contestSponsor()->createMany($sponsorData);
        }


        return to_route('user.contests.index')->with('message', 'Contest created successfully. Waiting for admin approval.');
    }


    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $user = User::find(Auth::id());
        $isMember = $user->subscriptions()->where('status', Subscription::STATUS_ACTIVE)->exists();
        $sponsor = Sponsor::where('user_id', Auth::id())->get();

        abort_if(!$isMember, 403, 'Access denied. You must be a member to show contests.');

        $contest = Contest::with('prizes', 'creator', 'reviews', 'entries', 'category')->findOrFail($id);
        return inertia('UserNavSection/OwnContest/Show', [
            'contest' => $contest,
            'sponsors' => $sponsor
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        $user = User::find(Auth::id());
        $isMember = $user->subscriptions()->where('status', Subscription::STATUS_ACTIVE)->exists();
        $sponsor = Sponsor::where('user_id', Auth::id())->get();
        abort_if(!$isMember, 403, 'Access denied. You must be a member to edit contests.');

        $contest = Contest::with('prizes', 'creator', 'category', 'contestSponsor')->findOrFail($id);
        $prizes = Prize::all();
        $contest->formats = $contest->formats ? json_decode($contest->formats) : [];
        $category = ContestCategory::all();


        return inertia('UserNavSection/OwnContest/Edit', [
            'contest' => $contest,
            'prizes' => $prizes,
            'categories' => $category,
            'sponsors' => $sponsor
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UserContestUpdate $request, string $id)
    {
        $contest = Contest::findOrFail($id);
        $validated = $request->validated();
        $validated['type'] = $request->type;
        $validated['formats'] = !empty($request->formats) ? json_encode($request->formats) : null;
        $validated['form_url'] = $request->form_url;
        $contest->update($validated);

        // Sync prizes
        if (isset($validated['prizes'])) {
            $contest->prizes()->sync($validated['prizes']);
        }



        $sponsorIds = $request->sponsor_ids ?? [];
        $contest->contestSponsor()
            ->whereNotIn('sponsor_id', $sponsorIds)
            ->delete();

        if (!empty($sponsorIds)) {
            foreach ($sponsorIds as $sponsorId) {

                // Find existing record
                $existing = $contest->contestSponsor()
                    ->where('sponsor_id', $sponsorId)
                    ->first();

                if (isset($request->sponsor_banners[$sponsorId]['file'])) {
                    $bannerPath = $request->sponsor_banners[$sponsorId]['file']
                        ->store("contest-banners/{$contest->id}");
                }

                if ($existing) {
                    $existing->update([
                        'banner' => $bannerPath ?? $existing->banner,
                    ]);
                } else {
                    $contest->contestSponsor()->create([
                        'sponsor_id' => $sponsorId,
                        'banner' => $bannerPath ?? null,
                    ]);
                }
            }
        }

        return to_route('user.contests.index')
            ->with('success', 'Contest updated successfully.');
    }


    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $user = User::find(Auth::id());
        $isMember = $user->subscriptions()->where('status', Subscription::STATUS_ACTIVE)->exists();
        abort_if(!$isMember, 403, 'Access denied. You must be a member to delete contests.');

        $contest = Contest::findOrFail($id);

        $contest->prizes()->detach();

        // Delete contest
        $contest->delete();

        return to_route('user.contests.index')->with('success', 'Contest deleted successfully.');
    }


    /***
     * Contest Entry Management Functions
     * Show the form for creating a new contest entry
     */

    public function entryIndex(Request $request, string $id)
    {

        $user = User::find(Auth::id());
        $isMember = $user->subscriptions()->where('status', Subscription::STATUS_ACTIVE)->exists();
        abort_if(!$isMember, 403, 'Access denied. You must be a member to show emtry.');

        try {
            $contest = Contest::findOrFail($id);
            $entries = Entry::with(['winner', 'user', 'votes', 'review'])
                ->where('contest_id', $id)
                ->when($request->filled('search'), fn($q) => $q->search($request->search))
                ->when($request->filled('status'), fn($q) => $q->where('status', $request->status))
                ->withCount(['review'])
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

            return Inertia::render('UserNavSection/OwnContest/EntryList', [
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



    /***
     * Contest entryReviewIndex Functions
     * Show the form for reviewing a new contest entry
     */


    public function contestReviewIndex(Request $request, string $id)
    {
        $user = User::find(Auth::id());
        $isMember = $user->subscriptions()->where('status', Subscription::STATUS_ACTIVE)->exists();
        abort_if(!$isMember, 403, 'Access denied. You must be a member to show reviews.');

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

        return inertia('UserNavSection/OwnContest/Reviews', compact('reviews'));
    }


    public function entryShow(string $id)
    {
        $user = User::find(Auth::id());
        $isMember = $user->subscriptions()->where('status', Subscription::STATUS_ACTIVE)->exists();
        abort_if(!$isMember, 403, 'Access denied. You must be a member to show entry.');

        $entry = \App\Models\Entry::with(['user', 'contest', 'votes'])->findOrFail($id);
        return inertia('UserNavSection/OwnContest/EntryView', compact('entry'));
    }
}
