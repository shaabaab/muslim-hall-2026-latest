<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Report extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'reason',
        'report_type',
        'status',
        'admin_note',
        'reportable_id',
        'reportable_type',
        'user_id',
        'handled_by'
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the parent reportable model (post, comment, etc.)
     */
    public function reportable(): MorphTo
    {
        return $this->morphTo();
    }
    public function category()
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    /**
     * User who created the report
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Admin who handled the report
     */
    public function handler(): BelongsTo
    {
        return $this->belongsTo(User::class, 'handled_by');
    }

    /**
     * Scope for pending reports
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope for reviewed reports
     */
    public function scopeReviewed($query)
    {
        return $query->where('status', 'reviewed');
    }

    /**
     * Scope for resolved reports
     */
    public function scopeResolved($query)
    {
        return $query->where('status', 'resolved');
    }

    /**
     * Check if user has already reported this item
     */
    public static function hasUserReported($userId, $reportableId, $reportableType)
    {
        return self::where('user_id', $userId)
            ->where('reportable_id', $reportableId)
            ->where('reportable_type', $reportableType)
            ->exists();
    }
}
