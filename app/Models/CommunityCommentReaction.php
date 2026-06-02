<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CommunityCommentReaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'community_comment_id',
        'user_id',
        'type'
    ];

    protected $table = 'community_comment_reactions';

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function comment()
    {
        return $this->belongsTo(CommunityComment::class);
    }
}