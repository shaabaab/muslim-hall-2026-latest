<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Reaction extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'type'];

    public function user() {
        return $this->belongsTo(User::class);
    }

    public function reactionable() {
        return $this->morphTo();
    }


    // Scope for searching reactions
    public function scopeSearch($query, $term)
    {
        $term = "%$term%";
        $query->whereHas('user', function ($q) use ($term) {
            $q->where('name', 'like', $term)
              ->orWhere('email', 'like', $term);
        });
    }

    //type scope
    public function scopeType($query, $type)
    {
        $query->where('type', $type);
    }



}
