<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ExhibitionBoardMember extends Model
{
    use HasFactory, SoftDeletes;

    const STATUS_PENDING = 'pending';
    const STATUS_APPROVED = 'approved';
    const STATUS_REJECTED = 'rejected';

    protected $fillable = [
        'exhibition_board_id',
        'user_id',
        'owner_status',
        'admin_status',
        'status',
        'owner_approved_at',
        'owner_approved_by',
        'admin_approved_at',
        'admin_approved_by',
        'request_message',
        'owner_note',
        'admin_note',
    ];

    protected $casts = [
        'owner_approved_at' => 'datetime',
        'admin_approved_at' => 'datetime',
    ];

    public function board()
    {
        return $this->belongsTo(ExhibitionBoard::class, 'exhibition_board_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class)->with('subscriptions');
    }

    public function ownerApprovedBy()
    {
        return $this->belongsTo(User::class, 'owner_approved_by');
    }

    public function adminApprovedBy()
    {
        return $this->belongsTo(User::class, 'admin_approved_by');
    }

    public function refreshFinalStatus()
    {
        if ($this->owner_status === self::STATUS_REJECTED || $this->admin_status === self::STATUS_REJECTED) {
            $this->status = self::STATUS_REJECTED;
        } elseif ($this->owner_status === self::STATUS_APPROVED && $this->admin_status === self::STATUS_APPROVED) {
            $this->status = self::STATUS_APPROVED;
        } else {
            $this->status = self::STATUS_PENDING;
        }

        $this->save();

        return $this;
    }

    public function approveByOwner($ownerId, $note = null)
    {
        $this->owner_status = self::STATUS_APPROVED;
        $this->owner_approved_at = now();
        $this->owner_approved_by = $ownerId;
        $this->owner_note = $note;
        $this->save();

        return $this->refreshFinalStatus();
    }

    public function rejectByOwner($ownerId, $note = null)
    {
        $this->owner_status = self::STATUS_REJECTED;
        $this->owner_approved_at = now();
        $this->owner_approved_by = $ownerId;
        $this->owner_note = $note;
        $this->save();

        return $this->refreshFinalStatus();
    }

    public function approveByAdmin($adminId, $note = null)
    {
        $this->admin_status = self::STATUS_APPROVED;
        $this->admin_approved_at = now();
        $this->admin_approved_by = $adminId;
        $this->admin_note = $note;
        $this->save();

        return $this->refreshFinalStatus();
    }

    public function rejectByAdmin($adminId, $note = null)
    {
        $this->admin_status = self::STATUS_REJECTED;
        $this->admin_approved_at = now();
        $this->admin_approved_by = $adminId;
        $this->admin_note = $note;
        $this->save();

        return $this->refreshFinalStatus();
    }
}