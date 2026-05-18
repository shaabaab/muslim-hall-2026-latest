<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArchivedContest extends Model
{
    use HasFactory;

    protected $fillable = [
        'summary',
        'contest_id',
        'archived_at',
    ];

    // Relationships (assuming related models exist)
    public function contest() { return $this->belongsTo(Contest::class); }
    
}
