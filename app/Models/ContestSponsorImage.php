<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ContestSponsorImage extends Model
{
    use HasFactory;

    protected $fillable = ['contest_sponsor_id', 'image'];


    public function contestSponsor()
    {
        return $this->belongsTo(ContestSponsor::class);
    }
}
