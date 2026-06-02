<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Seo extends Model
{
    use HasFactory;

    protected $fillable = [
        'meta_title', 'meta_description', 'meta_keywords',
        'meta_robots', 'og_title', 'og_description', 'og_image',
        'og_type', 'og_url', 'og_site_name', 'twitter_card',
        'twitter_title', 'twitter_description', 'twitter_image',
        'twitter_site', 'twitter_creator', 'canonical_url',
        'structured_data', 'focus_keywords',
    ];

    protected $casts = [
        'meta_keywords' => 'array',
        'structured_data' => 'array',
        'focus_keywords' => 'array',
    ];

    public function seoable()
    {
        return $this->morphTo();
    }
}
