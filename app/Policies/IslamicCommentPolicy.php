<?php

namespace App\Policies;

use App\Models\IslamicComment;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class IslamicCommentPolicy
{
    use HandlesAuthorization;

    public function update(User $user, IslamicComment $comment)
    {
        return $user->id === $comment->user_id;
    }

    public function delete(User $user, IslamicComment $comment)
    {
        return $user->id === $comment->user_id || $user->is_admin;
    }
}