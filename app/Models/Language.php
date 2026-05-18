<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Language extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'status',
    ];

    const ACTIVE = 1;
    const INACTIVE = 0;

    // Relationship with Post model
    public function posts()
    {
        return $this->hasMany(Post::class, 'code', 'id');
    }

    // Relationship with Category model
    public function categories()
    {
        return $this->hasMany(Category::class, 'code', 'id');
    }

    // Relationship with Section model
    public function sections()
    {
        return $this->hasMany(Section::class, 'code', 'id');
    }


    //local scope for active languages
    public function scopeActive($query)
    {
        return $query->where('status', self::ACTIVE);
    }

    
    public function scopeSearch($query, $search)
    {
         $query->where(function ($q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
                ->orWhere('code', 'like', "%{$search}%");
        });
    }


    public function scopeStatus($query, $status)
    {
        return $query->where('status', $status);
    }
}
