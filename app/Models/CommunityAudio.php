<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CommunityAudio extends Model
{
    use HasFactory;

    protected $table = 'community_audios';

    protected $fillable = ['community_id', 'audio'];

    public function community()
    {
        return $this->belongsTo(Community::class);
    }
}
