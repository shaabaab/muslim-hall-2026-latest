<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CommunityPostReaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'community_id',
        'user_id',
        'type'
    ];

    protected $table = 'community_post_reactions';

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function community()
    {
        return $this->belongsTo(Community::class);
    }
}