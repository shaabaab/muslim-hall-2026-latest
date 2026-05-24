<?php

namespace App\Http\Controllers;

use App\Models\Community;
use App\Models\Entry;
use App\Models\Exhibition;
use App\Models\Plan;
use App\Models\Post;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        if (Auth::user()->role == User::ROLE_ADMIN) {
            return redirect()->route('admin.dashboard');
        }

        $user = User::with([
            'roles',
            'subscriptions' => function ($query) {
                $query->with('plan')->latest();
            },
            'reviewsGiven',
            'posts' => function ($query) {
                $query->withCount(['comments', 'reactions']);
            },
            'exhibitions',
            'islamicZone',
            'communities'
        ])->findOrFail(Auth::id());

        $exhibitions = Exhibition::where('user_id', $user->id)
            ->with('user')
            ->latest()
            ->limit(5)
            ->get();

        $communitys = Community::where('user_id', $user->id)
            ->with(['user'])
            ->published()
            ->latest()
            ->limit(5)
            ->get();

        $posts = Post::with(['images', 'audios'])
            ->where('created_by', $user->id)
            ->withCount(['allComments', 'userReaction'])
            ->latest()
            ->limit(5)
            ->get();

        $contests = Entry::with(['contest', 'user', 'review', 'winner'])
            ->where('user_id', $user->id)
            ->latest()
            ->limit(5)
            ->get();

        $defaultPlan = Plan::active()
            ->where('plan_type', Plan::PLAN_PAID)
            ->orderBy('price', 'asc')
            ->first();

        return Inertia::render('UserNavSection/Dashboard', [
            'auth' => [
                'user' => $user,
            ],
            'user' => $user,
            'defaultPlan' => $defaultPlan,
            'total_contests' => \App\Models\Contest::where('created_by', Auth::id())->count(),
            'exhibitions' => $exhibitions,
            'communitys' => $communitys,
            'posts' => $posts,
            'contests' => $contests,
        ]);
    }
}