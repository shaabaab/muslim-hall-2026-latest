<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vote extends Model
{
    use HasFactory;

    protected $fillable = [
        'entry_id',
        'user_id',
        'contest_id'
    ];

    // Relationships (assuming related models exist)
    public function entry() { return $this->belongsTo(Entry::class)->with('contest'); }
    public function user() { return $this->belongsTo(User::class); }


    //search scope
    public function scopeSearch($query, $term)
    {
        $term = "%$term%";
        $query->whereHas('user', function($q) use ($term) {
            $q->where('name', 'like', $term)
              ->orWhere('email', 'like', $term);
        });
    }

}
