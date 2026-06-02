<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ContestCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'parent_id',
    ];

    // Relationships
    public function contests()
    {
        return $this->hasMany(Contest::class, 'category_id');
    }

    // Parent category relationship
    public function parent()
    {
        return $this->belongsTo(ContestCategory::class, 'parent_id');
    }


    // Search scope
    public function scopeSearch($query, $search)
    {
        $query->where(function ($q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
                ->orWhere('slug', 'like', "%{$search}%")
                ->orWhere('description', 'like', "%{$search}%");
        });
    }
}
