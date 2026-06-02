<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class IslamicZoneVideo extends Model
{
    use HasFactory;

    protected $table = 'islamic_zone_videos';
    protected $fillable = ['islamic_zone_id', 'video'];
}
