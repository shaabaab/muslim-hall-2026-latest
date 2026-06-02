<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CommunityReaction extends Model
{
    use HasFactory;

    protected $table = 'community_reactions';

    protected $fillable = [
        'community_id',
        'user_id',
        'type'
    ];

    protected $casts = [
        'type' => 'string'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function community()
    {
        return $this->belongsTo(Community::class, 'community_id');
    }
}