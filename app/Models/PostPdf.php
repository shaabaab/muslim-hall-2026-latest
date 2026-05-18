<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PostPdf extends Model
{
    use HasFactory;

    protected $fillable = ['post_id', 'pdf'];

    public function post()
    {
        return $this->belongsTo(Post::class);
    }
}
