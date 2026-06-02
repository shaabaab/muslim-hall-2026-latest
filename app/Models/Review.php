<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    use HasFactory;

    protected $fillable = [
        'entry_id',
        'contest_id',
        'reviewed_by',
        'comments',
        'decision',
        'rating'
    ];

    const STATUS_APPROVED = 1;
    const STATUS_REJECTED = 2;

    public static function getStatusList()
    {
        return [
            self::STATUS_APPROVED => 'Approved',
            self::STATUS_REJECTED => 'Rejected',
        ];
    }

    public function getStatusNameAttribute()
    {
        return self::getStatusList()[$this->status];
    }

    // Relationship: each review belongs to one entry
    public function entry()
    {
        return $this->belongsTo(Entry::class);
    }

    // Relationship: each review belongs to one contest
    public function contest()
    {
        return $this->belongsTo(Contest::class);
    }

    // Relationship: the user who made the review
    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }


    //search query scope
    public function scopeSearch($query, $term)
    {
        $term = "%$term%";  
        return $query->where(function ($q) use ($term) {
            $q->where('comments', 'like', $term)
              ->orWhere('decision', 'like', $term)
              ->orWhereHas('entry', function ($q) use ($term) {
                  $q->where('title', 'like', $term)
                    ->orWhere('content', 'like', $term);
              })
              ->orWhereHas('contest', function ($q) use ($term) {
                  $q->where('title', 'like', $term)
                    ->orWhere('description', 'like', $term);
              })
              ->orWhereHas('reviewer', function ($q) use ($term) {
                  $q->where('name', 'like', $term)
                    ->orWhere('email', 'like', $term);
              });
        });

    }

}
