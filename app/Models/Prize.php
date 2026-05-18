<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Prize extends Model
{
    use HasFactory;

    protected $fillable = [
        'position',
        'amount_normal_user',
        'amount_premium_user',
        'description',
    ];

    // Relationships (assuming related models exist)
    public function contests()
    {
        return $this->belongsToMany(Contest::class, 'contest_prize')->withTimestamps();
    }
    public function contest() { return $this->belongsTo(Contest::class); }
    public function winner() { return $this->belongsTo(Entry::class, 'winner_entry_id')->with(['user','votes']); }

}
