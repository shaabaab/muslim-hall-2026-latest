<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Facades\Storage;

class ExhibitionBoard extends Model
{
    use HasFactory, SoftDeletes;

    const STATUS_PENDING = 'pending';
    const STATUS_APPROVED = 'approved';
    const STATUS_REJECTED = 'rejected';

    protected $fillable = [
        'user_id',
        'title',
        'slug',
        'description',
        'image',
        'approval_status',
        'approved_at',
        'approved_by',
        'admin_note',
        'is_active',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    protected $appends = [
        'image_url',
    ];

    public function owner()
    {
        return $this->belongsTo(User::class, 'user_id')->with('subscriptions');
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function exhibitions()
    {
        return $this->hasMany(Exhibition::class, 'exhibition_board_id');
    }

    public function approvedExhibitions()
    {
        return $this->hasMany(Exhibition::class, 'exhibition_board_id')
            ->where('approval_status', Exhibition::APPROVAL_APPROVED)
            ->where('status', Exhibition::STATUS_PUBLISHED);
    }

    public function memberRequests()
    {
        return $this->hasMany(ExhibitionBoardMember::class, 'exhibition_board_id');
    }

    public function approvedMembers()
    {
        return $this->hasMany(ExhibitionBoardMember::class, 'exhibition_board_id')
            ->where('status', ExhibitionBoardMember::STATUS_APPROVED);
    }

    public function getImageUrlAttribute()
    {
        return $this->image ? Storage::url($this->image) : null;
    }

    public function scopeApproved($query)
    {
        return $query->where('approval_status', self::STATUS_APPROVED);
    }

    public function scopePending($query)
    {
        return $query->where('approval_status', self::STATUS_PENDING);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function approve($adminId)
    {
        return $this->update([
            'approval_status' => self::STATUS_APPROVED,
            'approved_at' => now(),
            'approved_by' => $adminId,
            'admin_note' => null,
        ]);
    }

    public function reject($adminId, $note = null)
    {
        return $this->update([
            'approval_status' => self::STATUS_REJECTED,
            'approved_at' => null,
            'approved_by' => $adminId,
            'admin_note' => $note,
        ]);
    }
}