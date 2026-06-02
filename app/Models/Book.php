<?php

namespace App\Models;

use App\Traits\HasSeo;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Book extends Model
{
    use HasFactory, HasSeo;

    protected $guarded = [];
    protected $casts = [
        'viewer_ips' => 'array',
    ];


    protected static function booted()
    {
        static::retrieved(function ($book) {
            // Prevent unnecessary DB writes during console or API requests without a request()
            if (app()->runningInConsole())
                return;

            $ip = request()->ip();
            if (!$ip)
                return;

            $viewerIps = $book->viewer_ips ?? [];

            if (!in_array($ip, $viewerIps)) {
                // Use updateQuietly() to avoid triggering events like 'retrieved' again
                $viewerIps[] = $ip;

                $book->updateQuietly([
                    'viewer_ips' => $viewerIps,
                    'view' => $book->view + 1,
                ]);
            }
        });
    }

    public function seo()
    {
        return $this->morphOne(Seo::class, 'seoable');
    }

    //search scrope
    public function scopeSearch($query, $term)
    {
        $term = "%$term%";
        $query->where('title', 'like', $term)
            ->orWhere('description', 'like', $term);
    }


    //sorted by type scope
    public function scopeSortByOption($query, $sort)
    {
        switch ($sort) {
            case 'newest':
                return $query->orderByDesc('id'); // Newest to oldest

            case 'oldest':
                return $query->orderBy('id'); // Oldest to newest

            case 'a_to_z':
                return $query->orderBy('title', 'asc'); // A → Z

            case 'z_to_a':
                return $query->orderBy('title', 'desc'); // Z → A

            default:
                return $query->orderByDesc('id'); // Default
        }
    }


}
