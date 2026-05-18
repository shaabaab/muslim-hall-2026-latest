<?php

namespace App\Policies;

use App\Models\ExhibitionComment;
use App\Models\User;

class ExhibitionCommentPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, ExhibitionComment $comment): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return !is_null($user);
    }

    public function update(User $user, ExhibitionComment $comment): bool
    {
        return $user->id === $comment->user_id || $user->is_admin;
    }

    public function delete(User $user, ExhibitionComment $comment): bool
    {
        return $user->id === $comment->user_id || $user->is_admin;
    }

    public function restore(User $user, ExhibitionComment $comment): bool
    {
        return $user->is_admin;
    }

    public function forceDelete(User $user, ExhibitionComment $comment): bool
    {
        return $user->is_admin;
    }
}