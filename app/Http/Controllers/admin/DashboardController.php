<?php

namespace App\Http\Controllers\admin;

use App\Http\Controllers\Controller;

use Inertia\Inertia;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Spatie\Permission\Models\Role;

class DashboardController extends Controller
{
    public function index()
    {
        $user = User::where('role', User::ROLE_USER)->whereHas('subscriptions')->get();
        $total_members = $user->count();

        $stats = [
            'total_users' => User::count(),
            'total_roles' => Role::count(),
            'total_members' => $total_members,
            'active_members' => $user->filter(function ($user) {
                return $user->subscriptions->where('status', \App\Models\Subscription::STATUS_ACTIVE)->count() > 0;
            })->count(),
            'inactive_members' => $user->filter(function ($user) {
                return $user->subscriptions->where('status', \App\Models\Subscription::STATUS_ACTIVE)->count() == 0;
            })->count(),
            'total_posts' => \App\Models\Post::count(),
            'latest_exhibitions' => \App\Models\Exhibition::latest()->take(1)->first(),
            'latest_community_posts' => \App\Models\Community::latest()->take(1)->first(),
            'latest_users' => User::latest()->take(1)->first(),
            'active_users' => User::whereNotNull('last_seen_at')
                ->where('last_seen_at', '>=', now()->subMinutes(5))
                ->count(),
        ];



        return Inertia::render('Dashboard', [
            'stats' => $stats
        ]);
    }
}