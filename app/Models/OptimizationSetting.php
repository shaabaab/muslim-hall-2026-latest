<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OptimizationSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'image_optimization_enabled',
        'image_quality',
        'video_optimization_enabled',
        'video_quality',
        'pdf_optimization_enabled',
        'pdf_quality',
    ];

    protected $casts = [
        'image_optimization_enabled' => 'boolean',
        'video_optimization_enabled' => 'boolean',
        'pdf_optimization_enabled'   => 'boolean',
    ];
}
