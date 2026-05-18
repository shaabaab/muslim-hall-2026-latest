<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ExhibitionComment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'exhibition_id',
        'user_id',
        'parent_id',
        'comment',
        'is_approved'
    ];

    public function exhibition()
    {
        return $this->belongsTo(Exhibition::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function parent()
    {
        return $this->belongsTo(ExhibitionComment::class, 'parent_id');
    }

    public function replies()
    {
        return $this->hasMany(ExhibitionComment::class, 'parent_id')->with('user', 'replies');
    }

    public function reactions()
    {
        return $this->hasMany(ExhibitionReaction::class);
    }
}