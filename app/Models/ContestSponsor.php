<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ContestSponsor extends Model
{
    use HasFactory;

    protected $fillable = [
        'contest_id',
        'sponsor_id',
        'banner',
    ];


    //contest relation
    public function contest()
    {
        return $this->belongsTo(Contest::class, 'contest_id');
    }

    //sponsor relation
    public function sponsor()
    {
        return $this->belongsTo(Sponsor::class, 'sponsor_id');
    }
}
