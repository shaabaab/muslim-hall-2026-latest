<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExhibitionVideo extends Model
{
    use HasFactory;

    protected $fillable = ['exhibition_id', 'video'];

    public function exhibition()
    {
        return $this->belongsTo(Exhibition::class);
    }
}
