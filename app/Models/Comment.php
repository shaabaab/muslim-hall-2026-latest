<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Comment extends Model
{
    use HasFactory;


    protected $fillable = [
        'post_id',
        'comment',
        'comment_by',
    ];


    // A comment belongs to one post
    public function post()
    {
        return $this->belongsTo(Post::class, 'post_id');
    }

    // Relationship with User model (commented by)
    public function commentBy()
    {
        return $this->belongsTo(User::class, 'comment_by' , 'id');
    }

    public function reactions() {
        return $this->morphMany(Reaction::class, 'reactionable');
    }

    // Scope for searching comments
    public function scopeSearch($query, $term)
    {
        $term = "%$term%";

        $query->where(function ($q) use ($term) {
        $q->where('comment', 'like', $term)
            ->orWhereHas('commentBy', function ($userQuery) use ($term) {
                $userQuery->where('name', 'like', $term)
                        ->orWhere('email', 'like', $term);
            });
        });

    }


}
