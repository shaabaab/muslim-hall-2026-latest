<?php

namespace App\Http\Controllers;

use App\Http\Requests\ContestFeeStore;
use App\Http\Requests\ContestStore;
use App\Http\Requests\ContestUpdate;
use Illuminate\Http\Request;
use App\Models\Contest;
use App\Models\ContestCategory;
use App\Models\ContestFee;
use App\Models\Prize;
use App\Models\Sponsor;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ContestController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $contests = Contest::with(['creator', 'prizes', 'entries', 'reviews', 'category', 'contestSponsor'])
            ->where('status', '!=', Contest::STATUS_ENDED)
            ->where('status', '!=', Contest::STATUS_ARCHIVED)
            ->when($request->filled('search'), fn($q) => $q->search($request->search))
            ->when($request->filled('status'), fn($q) => $q->status($request->status))
            ->when($request->filled('is_on_hold'), fn($q) => $q->isOnHold($request->is_on_hold))
            ->orderByDesc('id')
            ->withCount('contestSponsor')
            ->paginate($request->get('per_page', 10))
            ->withQueryString();


        return Inertia::render('Contest/Index', [
            'contests' => $contests,
            'filters' => $request->only(['search', 'status']),
        ]);
    }
    public function approve($id)
    {
        $contest = Contest::findOrFail($id);
        $contest->admin_approval = 1;
        $contest->status = Contest::STATUS_RUNNING;
        $contest->save();

        return back()->with('success', 'Contest approved successfully');
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $prizePoll = Prize::all();
        $category = ContestCategory::all();
        $sponsor = Sponsor::where('user_id', Auth::id())->get();
        return inertia('Contest/Create', [
            'prizes' => $prizePoll,
            'categories' => $category,
            'sponsors' => $sponsor
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */

    public function store(ContestStore $request)
    {
        $validated = $request->validated();
        $validated['created_by'] = auth()->id();
        $validated['amount'] = $request->payment_type == Contest::PAYMENT_PAID ? $request->amount : 0;

        // Add new fields from the request
        $validated['type'] = $request->type;
        $validated['formats'] = !empty($request->formats) ? json_encode($request->formats) : null;
        $validated['form_url'] = $request->form_url;

        $contest = Contest::create($validated);

        $contest->prizes()->sync($request->prizes);

        if ($request->sponsor_ids) {
            $sponsorData = [];
            foreach ($request->sponsor_ids as $sponsorId) {
                if (isset($request->sponsor_banners[$sponsorId]['file'])) {
                    $bannerFile = $request->sponsor_banners[$sponsorId]['file'];
                    $bannerPath = $bannerFile->store(
                        'contest-banners/' . $contest->id,
                        'public'
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

        return to_route('admin.contests.index')->with('success', 'Contest created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $contest = Contest::with('prizes', 'creator', 'reviews', 'entries', 'category', 'contestSponsor')->findOrFail($id);
        return inertia('Contest/Show', [
            'contest' => $contest
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        $sponsor = Sponsor::all();
        $contest = Contest::with('prizes', 'creator', 'category', 'contestSponsor')->findOrFail($id);
        $prizes = Prize::all();
        $contest->formats = $contest->formats ? json_decode($contest->formats) : [];

        $category = ContestCategory::all();


        return inertia('Contest/Edit', [
            'contest' => $contest,
            'prizes' => $prizes,
            'categories' => $category,
            'sponsors' => $sponsor
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(ContestUpdate $request, string $id)
    {
        $contest = Contest::findOrFail($id);
        $validated = $request->validated();

        $validated['user_type'] = $request->user_type;
        $validated['payment_type'] = $request->payment_type;
        $validated['amount'] = $request->payment_type == Contest::PAYMENT_PAID ? $request->amount : 0;
        $validated['is_on_hold'] = $request->is_on_hold ?? false;


        $validated['type'] = $request->type;
        $validated['formats'] = !empty($request->formats) ? json_encode($request->formats) : null;
        $validated['form_url'] = $request->form_url;

        $contest->update($validated);

        if (isset($validated['prizes'])) {
            $contest->prizes()->sync($validated['prizes']);
        }

        if ($request->sponsor_ids) {
            $contest->contestSponsor()->whereNotIn('sponsor_id', $request->sponsor_ids)->delete();

            $sponsorData = [];
            foreach ($request->sponsor_ids as $sponsorId) {
                $existingSponsor = $contest->contestSponsor()->where('sponsor_id', $sponsorId)->first();

                if (isset($request->sponsor_banners[$sponsorId]['file'])) {
                    $bannerFile = $request->sponsor_banners[$sponsorId]['file'];
                    $bannerPath = $bannerFile->store(
                        'contest-banners/' . $contest->id,
                        'public'
                    );

                    if ($existingSponsor) {
                        $existingSponsor->update(['banner' => $bannerPath]);
                    } else {
                        $sponsorData[] = [
                            'sponsor_id' => $sponsorId,
                            'contest_id' => $contest->id,
                            'banner' => $bannerPath,
                        ];
                    }
                } elseif (isset($request->sponsor_banners[$sponsorId]['remove_existing'])) {
                    if ($existingSponsor) {
                        $existingSponsor->update(['banner' => null]);
                    }
                } elseif (!$existingSponsor) {
                    $sponsorData[] = [
                        'sponsor_id' => $sponsorId,
                        'contest_id' => $contest->id,
                        'banner' => null,
                    ];
                }
            }

            if (!empty($sponsorData)) {
                $contest->contestSponsor()->createMany($sponsorData);
            }
        } else {
            $contest->contestSponsor()->delete();
        }

        return to_route('admin.contests.index')->with('success', 'Contest updated successfully.');
    }


    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $contest = Contest::findOrFail($id);
        $contest->prizes()->detach();
        $contest->delete();
        return to_route('admin.contests.index')->with('success', 'Contest deleted successfully.');
    }


    /**
     * Display the contest fee for a specific contest.
     */
    public function contestFee($id)
    {

        return inertia('Contest/ContestFee', [
            'contest' => Contest::findOrFail($id) ?? [],
            'sponsors' => Sponsor::all() ?? [],
            'users' => User::where('role', User::ROLE_USER)->get() ?? [],
        ]);
    }





    public function contestFeeStore(ContestFeeStore $request)
    {

        $validated = $request->validated();
        $validated['status'] = 'completed';

        ContestFee::create($validated);

        // return to_route('admin.contests.index')->with('success', 'Contest fee recorded successfully.');
        return back()->with('success', 'Contest fee recorded successfully.');
    }

    /**
     * Display a listing of all contest fees.
     */
    public function feesIndex(Request $request)
    {
        $fees = ContestFee::with(['contest', 'user', 'sponsor'])
            ->when($request->filled('search'), function ($q) use ($request) {
                $q->whereHas('contest', fn($c) => $c->where('title', 'like', '%' . $request->search . '%'))
                    ->orWhereHas('user', fn($u) => $u->where('name', 'like', '%' . $request->search . '%'));
            })
            ->orderByDesc('created_at')
            ->paginate($request->get('per_page', 10))
            ->withQueryString();

        return Inertia::render('Contest/FeesIndex', [
            'fees' => $fees,
            'filters' => $request->only(['search', 'per_page']),
        ]);
    }
}
