<?php

namespace App\Policies;

use App\Models\Community;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class CommunityPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user)
    {
        return true;
    }

    public function view(User $user, Community $post)
    {
        return $post->isPublished() || $user->id === $post->user_id;
    }

    public function create(User $user)
    {
        return true;
    }

    public function update(User $user, Community $post)
    {
        return $user->id === $post->user_id;
    }

    public function delete(User $user, Community $post)
    {
        return $user->id === $post->user_id;
    }
}