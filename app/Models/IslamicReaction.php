<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class IslamicReaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'islamic_zone_id',
        'user_id',
        'type'
    ];

    protected $casts = [
        'type' => 'string'
    ];

    public function islamicZone()
    {
        return $this->belongsTo(IslamicZone::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}