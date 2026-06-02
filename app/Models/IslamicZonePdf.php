<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class IslamicZonePdf extends Model
{
    use HasFactory;

    protected $table = 'islamic_zone_pdfs';
    protected $fillable = ['islamic_zone_id', 'pdf'];
}
