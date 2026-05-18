<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExhibitionReaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'exhibition_id',
        'user_id',
        'type'
    ];

    protected $casts = [
        'type' => 'string'
    ];

    public function exhibitionZone()
    {
        return $this->belongsTo(Exhibition::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}