<?php

namespace App\Http\Controllers;

use App\Models\Community;
use App\Models\Contest;
use App\Models\Entry;
use App\Models\Exhibition;
use App\Models\Plan;
use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $authUser = Auth::user();

        if ($authUser->role == User::ROLE_ADMIN) {
            return redirect()->route('admin.dashboard');
        }

        $userId = Auth::id();

        $user = User::with([
            'roles',
            'subscriptions' => function ($query) {
                $query->with('plan')->latest();
            },
            'reviewsGiven',
        ])->findOrFail($userId);

        /*
        |--------------------------------------------------------------------------
        | ONLY LOGGED-IN USER POSTS
        |--------------------------------------------------------------------------
        */
        $allUserPosts = Post::with(['images', 'audios'])
            ->withCount(['comments', 'reactions'])
            ->where('created_by', $userId)
            ->where('status', 1)
            ->latest()
            ->get();

        $posts = Post::with(['images', 'audios'])
            ->withCount(['allComments', 'userReaction'])
            ->where('created_by', $userId)
            ->where('status', 1)
            ->latest()
            ->limit(5)
            ->get();

        /*
        |--------------------------------------------------------------------------
        | ONLY LOGGED-IN USER EXHIBITIONS
        |--------------------------------------------------------------------------
        | Supports both user_id and created_by, because different modules often use
        | different owner columns.
        |--------------------------------------------------------------------------
        */
        $allUserExhibitions = Exhibition::query()
            ->with('user')
            ->where(function ($query) use ($userId) {
                $this->applyOwnerFilter($query, 'exhibitions', $userId);
            })
            ->latest()
            ->get();

        $exhibitions = Exhibition::query()
            ->with('user')
            ->where(function ($query) use ($userId) {
                $this->applyOwnerFilter($query, 'exhibitions', $userId);
            })
            ->latest()
            ->limit(5)
            ->get();

        /*
        |--------------------------------------------------------------------------
        | ONLY LOGGED-IN USER COMMUNITIES
        |--------------------------------------------------------------------------
        | Removed global "all user" risk. This will show only this user's own
        | community data. If you want only published data, uncomment published().
        |--------------------------------------------------------------------------
        */
        $allUserCommunities = Community::query()
            ->with('user')
            ->where(function ($query) use ($userId) {
                $this->applyOwnerFilter($query, 'communities', $userId);
            })
            ->latest()
            ->get();

        $communitys = Community::query()
            ->with('user')
            ->where(function ($query) use ($userId) {
                $this->applyOwnerFilter($query, 'communities', $userId);
            })
            // ->published()
            ->latest()
            ->limit(5)
            ->get();

        /*
        |--------------------------------------------------------------------------
        | ONLY LOGGED-IN USER CONTEST PARTICIPATIONS
        |--------------------------------------------------------------------------
        */
        $contests = Entry::with(['contest', 'user', 'review', 'winner'])
            ->where('user_id', $userId)
            ->latest()
            ->limit(5)
            ->get();

        /*
        |--------------------------------------------------------------------------
        | ONLY LOGGED-IN USER CREATED CONTEST COUNT
        |--------------------------------------------------------------------------
        */
        $totalContests = Contest::where('created_by', $userId)->count();

        /*
        |--------------------------------------------------------------------------
        | Set relations manually for frontend dashboard counts/chart
        |--------------------------------------------------------------------------
        | Your JSX uses user.posts/user.communities/user.exhibitions, so we attach
        | already-filtered collections here.
        |--------------------------------------------------------------------------
        */
        $user->setRelation('posts', $allUserPosts);
        $user->setRelation('exhibitions', $allUserExhibitions);
        $user->setRelation('communities', $allUserCommunities);

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
            'total_contests' => $totalContests,
            'exhibitions' => $exhibitions,
            'communitys' => $communitys,
            'posts' => $posts,
            'contests' => $contests,
        ]);
    }

    private function applyOwnerFilter(Builder $query, string $table, int $userId): void
    {
        $hasUserId = Schema::hasColumn($table, 'user_id');
        $hasCreatedBy = Schema::hasColumn($table, 'created_by');

        if ($hasUserId && $hasCreatedBy) {
            $query->where('user_id', $userId)
                ->orWhere('created_by', $userId);

            return;
        }

        if ($hasUserId) {
            $query->where('user_id', $userId);

            return;
        }

        if ($hasCreatedBy) {
            $query->where('created_by', $userId);

            return;
        }

        $query->whereRaw('1 = 0');
    }
}