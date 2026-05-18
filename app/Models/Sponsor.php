<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Sponsor extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'email', 
        'password',
        'photo',
        'phone',
        'phone_alternative',
        'email_verified_at',
        'user_id',
        'website',
    ];

    protected $hidden = [
        'password',
    ];

    /**
     * Get the user associated with the sponsor.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }


    //search scope
    public function scopeSearch($query, $term)
    {
        $term = "%$term%";
        $query->where(function ($q) use ($term) {
            $q->where('name', 'like', $term)
              ->orWhere('email', 'like', $term)
              ->orWhere('phone', 'like', $term);
        });
    }
}