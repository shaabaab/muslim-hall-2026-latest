<?php

namespace App\Http\Controllers;

use App\Models\Badge;
use App\Models\Subscription;
use App\Models\SubscriptionPayment;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BadgeController extends Controller
{
    /**
     * Display all badges (Admin side)
     */
    public function index()
    {
        $badges = Badge::all();
        return Inertia::render('Badge/Index', [
            'badges' => $badges,
        ]);
    }

    /**
     * Show form for creating a new badge
     */
    public function create()
    {
        return Inertia::render('Badge/Create');
    }

    /**
     * Store a newly created badge in the database
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|unique:badges,name',
            'min_amount' => 'required|numeric|min:0',
            'max_amount' => 'nullable|numeric|gt:min_amount',
            'color' => 'nullable|string',
        ]);

        Badge::create([
            'name' => $request->name,
            'min_amount' => $request->min_amount,
            'max_amount' => $request->max_amount,
            'color' => $request->color,
        ]);

        return to_route('admin.badges.index')
                         ->with('success', 'Badge created successfully!');
    }

    /**
     * Edit an existing badge
     */
    public function edit($id)
    {
        $badge = Badge::findOrFail($id);

        return Inertia::render('Badge/Edit', [
            'badge' => $badge,
        ]);
    }

    /**
     * Update badge info
     */
    public function update(Request $request, $id)
    {
        $badge = Badge::findOrFail($id);

        $request->validate([
            'name' => 'required|string|unique:badges,name,' . $badge->id,
            'min_amount' => 'required|numeric|min:0',
            'max_amount' => 'nullable|numeric|gt:min_amount',
            'color' => 'nullable|string',
        ]);

        $badge->update([
            'name' => $request->name,
            'min_amount' => $request->min_amount,
            'max_amount' => $request->max_amount,
            'color' => $request->color,
        ]);

        return to_route('admin.badges.index')
                         ->with('success', 'Badge updated successfully!');
    }

    /**
     * Delete badge
     */
    public function destroy($id)
    {
        $badge = Badge::findOrFail($id);
        $badge->delete();

        return redirect()->route('admin.badges.index')
                         ->with('success', 'Badge deleted successfully!');
    }

    /**
     * Assign badges to users based on total payment
     */
    public function assignBadges()
    {
        $users = User::with('subscriptions')->get();
        $badges = Badge::all();

        foreach ($users as $user) {
            $totalPaid = $user->subscriptions()->payments()
                             ->where(
                    fn($query) => $query->where('status', SubscriptionPayment::STATUS_COMPLETED)
                                         ->sum('amount')
            );

            $matchedBadge = $badges->first(function ($badge) use ($totalPaid) {
                return $totalPaid >= $badge->min_amount &&
                       ($badge->max_amount === null || $totalPaid <= $badge->max_amount);
            });

            if ($matchedBadge) {
                $user->update(['badge' => $matchedBadge->name]);
            }
        }

        return back()->with('success', 'All user badges updated successfully!');
    }

    /**
     * Show a single user’s badge (User profile view)
     */
    public function showUserBadge($id)
    {
        $user = User::findOrFail($id);
        $badge = $user->badge ?? 'New';

        return Inertia::render('Users/Badge', [
            'user' => $user,
            'badge' => $badge,
        ]);
    }
}
