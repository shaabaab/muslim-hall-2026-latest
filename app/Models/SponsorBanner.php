<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SponsorBanner extends Model
{
    use HasFactory;

    protected $fillable = [
        'sponsor_id',
        'contest_id',
        'banner',
    ];


    public function sponsor()
    {
        return $this->belongsToMany(ContestSponsor::class, 'sponsor_id');
    }

    public function contest()
    {
        return $this->belongsTo(Contest::class, 'contest_id');
    }
}
