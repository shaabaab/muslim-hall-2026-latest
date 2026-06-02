<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PostReaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'post_id',
        'user_id',
        'type'
    ];

    protected $casts = [
        'type' => 'string'
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }

    
    // Scope for searching reactions
    public function scopeSearch($query, $term)
    {
        $term = "%$term%";
        $query->whereHas('user', function ($q) use ($term) {
            $q->where('name', 'like', $term)
              ->orWhere('email', 'like', $term);
        });
    }

    //type scope
    public function scopeType($query, $type)
    {
        $query->where('type', $type);
    }
}