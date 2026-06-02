<?php
// app/Http/Controllers/FollowController.php

namespace App\Http\Controllers;

use App\Models\Follow;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FollowController extends Controller
{
    /**
     * Follow a user
     */
    public function follow($id)
    {
        $user = User::findOrFail($id);

        if (auth()->id() === $user->id) {
            return back()->withErrors('info', 'You cannot follow yourself.');
        }

        // Check if already following
        $alreadyFollowing = Follow::where('follower_id', auth()->id())
            ->where('following_id', $user->id)
            ->exists();

        if ($alreadyFollowing) {
            return back()->withErrors('info', 'You are already following this user.');
        }

        // Follow the user
        Follow::create([
            'follower_id' => auth()->id(),
            'following_id' => $user->id,
        ]);

        // Optional: Create notification for the followed user
        // $user->notify(new NewFollowerNotification(auth()->user()));

        if (request()->wantsJson()) {
            return response()->json([
                'message' => 'Successfully followed user.',
                'followers_count' => $user->followers()->count(),
                'is_following' => true
            ]);
        }

        return back()->with('success', 'You are now following ' . $user->name);
    }

    /**
     * Unfollow a user
     */
    public function unfollow($id)
    {

        $user = User::findOrFail($id);

        $unfollowed = Follow::where('follower_id', auth()->id())
            ->where('following_id', $user->id)
            ->delete();

        if (!$unfollowed) {
            return back()->withErrors('info', 'You are not following this user.');
        }

        if (request()->wantsJson()) {
            return response()->json([
                'message' => 'Successfully unfollowed user.',
                'followers_count' => $user->followers()->count(),
                'is_following' => false
            ]);
        }

        return back()->with('success', 'You have unfollowed ' . $user->name);
    }

    /**
     * Get user's followers list
     */
    public function followers(User $user)
    {
        $followers = $user->followers()
            ->withCount(['followers', 'following'])
            ->paginate(20);

        if (request()->wantsJson()) {
            return response()->json([
                'followers' => $followers,
                'followers_count' => $user->followers()->count()
            ]);
        }

        return inertia('User/Followers', [
            'user' => $user,
            'followers' => $followers,
            'followers_count' => $user->followers()->count()
        ]);
    }

    /**
     * Get users that the user is following
     */
    public function following(User $user)
    {
        $following = $user->following()
            ->withCount(['followers', 'following'])
            ->paginate(20);

        if (request()->wantsJson()) {
            return response()->json([
                'following' => $following,
                'following_count' => $user->following()->count()
            ]);
        }

        return inertia('User/Following', [
            'user' => $user,
            'following' => $following,
            'following_count' => $user->following()->count()
        ]);
    }


    public function toggleFollow($id)
    {

        $authUser = User::find(auth()->id());
        $user = User::findOrFail($id);

        dd($authUser,$user);

        if ($authUser->id === $user->id) {
            return back()->withErrors('error', 'You cannot follow yourself.');
        }

        if ($authUser->isFollowing($user)) {
            $authUser->followings()->detach($user->id);
            $status = 'unfollowed';
        } else {
            $authUser->followings()->attach($user->id);
            $status = 'followed';
        }

        return back()->with('status', $status);
    }


    /**
     * Check if current user is following a specific user
     */
    // public function checkFollowStatus(User $user)
    // {
    //     $isFollowing = auth()->check() ? auth()->user()->isFollowing($user) : false;

    //     return response()->json([
    //         'is_following' => $isFollowing,
    //         'followers_count' => $user->followers()->count(),
    //         'following_count' => $user->following()->count()
    //     ]);
    // }

    /**
     * Get follow suggestions for current user
     */
    public function suggestions()
    {
        $suggestions = User::where('id', '!=', auth()->id())
            ->whereNotIn('id', function ($query) {
                $query->select('following_id')
                    ->from('followers')
                    ->where('follower_id', auth()->id());
            })
            ->inRandomOrder()
            ->limit(10)
            ->get(['id', 'name', 'username', 'avatar', 'bio']);

        return response()->json([
            'suggestions' => $suggestions
        ]);
    }

    /**
     * Bulk follow users (for suggestions)
     */
    public function bulkFollow(Request $request)
    {
        $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id'
        ]);

        $currentUserId = auth()->id();
        $userIds = $request->user_ids;

        // Remove current user ID if present
        $userIds = array_filter($userIds, function ($id) use ($currentUserId) {
            return $id != $currentUserId;
        });

        // Get already followed users
        $alreadyFollowing = DB::table('followers')
            ->where('follower_id', $currentUserId)
            ->whereIn('following_id', $userIds)
            ->pluck('following_id')
            ->toArray();

        // Filter out already followed users
        $usersToFollow = array_diff($userIds, $alreadyFollowing);

        if (empty($usersToFollow)) {
            return response()->json([
                'message' => 'You are already following all selected users.',
                'followed_count' => 0
            ]);
        }

        // Bulk insert follows
        $followData = [];
        $now = now();
        foreach ($usersToFollow as $userId) {
            $followData[] = [
                'follower_id' => $currentUserId,
                'following_id' => $userId,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        DB::table('followers')->insert($followData);

        return response()->json([
            'message' => 'Successfully followed ' . count($usersToFollow) . ' users.',
            'followed_count' => count($usersToFollow)
        ]);
    }

    /**
     * Remove a follower (current user removes someone who follows them)
     */
    public function removeFollower(User $user)
    {
        $removed = DB::table('followers')
            ->where('follower_id', $user->id) 
            ->where('following_id', auth()->id()) 
            ->delete();

        $user = User::find($user->id);

        if (!$removed) {
            return back()->with('error', 'This user is not following you.');
        }

        if (request()->wantsJson()) {
            return response()->json([
                'message' => 'Follower removed successfully.',
                'followers_count' => $user->followers()->count()
            ]);
        }

        return back()->with('success', 'Follower removed successfully.');
    }
}