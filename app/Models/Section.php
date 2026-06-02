<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\HasSeo;


class Section extends Model
{
    use HasFactory,HasSeo;

     protected $fillable = [
        'name',
        'slug',
        'description',
        'status',
        'lang_id',
    ];

    const ACTIVE = 1;
    const INACTIVE = 0;

    // Relationship with Language model
    public function language()
    {
        return $this->belongsTo(Language::class, 'lang_id', 'id');
    }

    // Relationship with Post model
    public function posts()
    {
        return $this->hasMany(Post::class, 'id', 'id');
    }

    //global scope when delted section then all relared posts also deleted
    protected static function booted()
    {
         static::deleting(function ($section) {
            $section->posts()->delete();
        });

    }


    //local scope for active sections
    public function scopeActive($query)
    {
        return $query->where('status', self::ACTIVE);
    }

    //seo relationship
    public function seo()
    {
        return $this->morphOne(Seo::class, 'seoable');
    }

}