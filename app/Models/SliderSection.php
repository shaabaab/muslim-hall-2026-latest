<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SliderSection extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'subtitle',
        'image_path',
        'background_color',
        'link',
        'lang_id',
        'is_full_width_image',
    ];

    public function language()
    {
        return $this->belongsTo(Language::class, 'lang_id');
    }
}
