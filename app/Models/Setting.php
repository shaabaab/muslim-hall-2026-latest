<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use HasFactory;

    protected $fillable = [
        'header_title',
        'footer_title',
        'footer_content',
        'favicon',
        'header_logo',
        'footer_logo',
        'lang_id',
    ];

    public function language()
    {
        return $this->belongsTo(Language::class, 'lang_id');
    }
}
