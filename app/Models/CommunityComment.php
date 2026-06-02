<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class CommunityComment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'community_id',
        'user_id',
        'parent_id',
        'content',
        'is_approved'
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function community()
    {
        return $this->belongsTo(Community::class);
    }

    public function parent()
    {
        return $this->belongsTo(CommunityComment::class, 'parent_id');
    }

    public function replies()
    {
        return $this->hasMany(CommunityComment::class, 'parent_id');
    }

    public function reactions()
    {
        return $this->hasMany(CommunityCommentReaction::class);
    }

    // Helper methods
    public function isReply()
    {
        return !is_null($this->parent_id);
    }
}