<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PostComment extends Model
{
    use HasFactory;

    protected $fillable = [
        'post_id',
        'user_id',
        'parent_id',
        'comment',
        'is_approved'
    ];

    protected $with = ['user', 'replies.user'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }

    public function replies(): HasMany
    {
        return $this->hasMany(PostComment::class, 'parent_id')->orderBy('created_at', 'asc');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(PostComment::class, 'parent_id');
    }


    
    // Scope for searching comments
    public function scopeSearch($query, $term)
    {
        $term = "%$term%";

        $query->where(function ($q) use ($term) {
        $q->where('comment', 'like', $term)
            ->orWhereHas('user', function ($userQuery) use ($term) {
                $userQuery->where('name', 'like', $term)
                        ->orWhere('email', 'like', $term);
            });
        });

    }
}