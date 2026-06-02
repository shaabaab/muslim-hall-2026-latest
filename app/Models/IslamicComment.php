<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class IslamicComment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'islamic_zone_id',
        'user_id',
        'parent_id',
        'comment',
        'is_approved'
    ];

    public function islamicZone()
    {
        return $this->belongsTo(IslamicZone::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function parent()
    {
        return $this->belongsTo(IslamicComment::class, 'parent_id');
    }

    public function replies()
    {
        return $this->hasMany(IslamicComment::class, 'parent_id')->with('user', 'replies');
    }

    public function reactions()
    {
        return $this->hasMany(IslamicReaction::class);
    }
}