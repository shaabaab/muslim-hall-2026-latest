<?php

namespace App\Policies;

use App\Models\CommunityComment;
use App\Models\User;

class CommunityCommentPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, CommunityComment $comment): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return !is_null($user);
    }

    public function update(User $user, CommunityComment $comment): bool
    {
        return $user->id === $comment->user_id || $user->role === 'admin';
    }

    public function delete(User $user, CommunityComment $comment): bool
    {
        return $user->id === $comment->user_id || $user->role === 'admin';
    }

    public function restore(User $user, CommunityComment $comment): bool
    {
        return $user->role === 'admin';
    }

    public function forceDelete(User $user, CommunityComment $comment): bool
    {
        return $user->role === 'admin';
    }
}