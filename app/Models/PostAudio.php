<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PostAudio extends Model
{
    use HasFactory;

    protected $table = 'post_audios';

    protected $fillable = ['post_id', 'audio'];

    public function post()
    {
        return $this->belongsTo(Post::class);
    }
}
