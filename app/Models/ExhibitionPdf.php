<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExhibitionPdf extends Model
{
    use HasFactory;

    protected $fillable = ['exhibition_id', 'pdf'];

    public function exhibition()
    {
        return $this->belongsTo(Exhibition::class);
    }
}
