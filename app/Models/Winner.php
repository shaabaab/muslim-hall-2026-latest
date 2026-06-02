<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Winner extends Model
{
    use HasFactory;

    protected $fillable = [
        'contest_id',
        'entry_id',
        'type',
        'position',
    ];

    // Relationships
    public function contest() { return $this->belongsTo(Contest::class); }
    public function entry() { return $this->belongsTo(Entry::class)->with('user'); }

}
