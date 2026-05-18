<?php

namespace App\Models;

use Dotenv\Parser\Entry;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EntryImage extends Model
{
    use HasFactory;
    protected $table = 'entries_images';
    protected $fillable = [
        'entries_id',
        'image',
    ];

    public function entries()
    {
        return $this->belongsTo(Entry::class);
    }
}
