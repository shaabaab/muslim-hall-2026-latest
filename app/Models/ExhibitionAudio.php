<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExhibitionAudio extends Model
{
    use HasFactory;

    protected $table = 'exhibition_audios';

    protected $fillable = ['exhibition_id', 'audio'];

    public function exhibition()
    {
        return $this->belongsTo(Exhibition::class);
    }
}
