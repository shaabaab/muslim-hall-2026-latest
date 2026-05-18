<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Community extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'title',
        'content',
        'image',
        'category',
        'mood',
        'location',
        'tags',
        'is_featured',
        'status',
        'views',
        'likes_count',
        'comments_count',
        'slug',
        'viewer_ips',
    ];

    protected $casts = [
        'status' => 'string',
        'tags' => 'array',
        'is_featured' => 'boolean',
        'viewer_ips' => 'array',
    ];

    // protected static function booted()
    // {
    //     static::retrieved(function ($community) {
    //         if (request()->ip()) {
    //             $viewerIps = json_decode($community->viewer_ips ?? '[]', true);

    //             if (!in_array(request()->ip(), $viewerIps)) {
    //                 $viewerIps[] = request()->ip();
    //                 $community->viewer_ips = json_encode($viewerIps);
    //                 $community->increment('views');
    //                 $community->save(); // Important: save the changes
    //             }
    //         }
    //     });
    // }


    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function comments()
    {
        return $this->hasMany(CommunityComment::class)->whereNull('parent_id');
    }

    public function allComments()
    {
        return $this->hasMany(CommunityComment::class);
    }

    public function reactions()
    {
        return $this->hasMany(CommunityPostReaction::class);
    }

    // Scopes
    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    //seo relationship
    public function seo()
    {
        return $this->morphOne(Seo::class, 'seoable');
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    public function scopeWithCategory($query, $category)
    {
        if ($category && $category !== 'all') {
            return $query->where('category', $category);
        }
        return $query;
    }

    // Add this search scope method
    public function scopeSearch($query, $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('title', 'like', '%' . $search . '%')
                ->orWhere('content', 'like', '%' . $search . '%')
                ->orWhere('category', 'like', '%' . $search . '%')
                ->orWhereHas('user', function ($userQuery) use ($search) {
                    $userQuery->where('name', 'like', '%' . $search . '%');
                })
                ->orWhereJsonContains('tags', $search); // Search in JSON tags array
        });
    }

    public function isPublished()
    {
        return $this->status === 'published';
    }
}
