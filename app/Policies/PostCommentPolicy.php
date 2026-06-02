<?php

namespace App\Policies;

use App\Models\PostComment;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class PostCommentPolicy
{
    public function update(User $user, PostComment $comment)
    {
        return $user->id === $comment->user_id || $user->is_admin;
    }

    public function delete(User $user, PostComment $comment)
    {
        return $user->id === $comment->user_id || $user->is_admin;
    }
}