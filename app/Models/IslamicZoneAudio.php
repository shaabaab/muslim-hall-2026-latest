<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class IslamicZoneAudio extends Model
{
    use HasFactory;

    protected $table = 'islamic_zone_audios';
    protected $fillable = ['islamic_zone_id', 'audio'];
}
