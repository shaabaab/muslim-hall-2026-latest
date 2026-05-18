<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\HasSeo;
use Illuminate\Support\Facades\Storage;
use function App\Helpers\getS3PublicUrl;

class Advertisement extends Model
{
    use HasFactory, SoftDeletes, HasSeo;

    protected $guarded = [];

    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'targeting' => 'array',
        'is_active' => 'boolean',
        'is_featured' => 'boolean',
        'cost_per_impression' => 'decimal:4',
        'cost_per_click' => 'decimal:4',
        'total_budget' => 'decimal:2',
        'spent_amount' => 'decimal:2',
    ];

    public function getImageUrlAttribute()
    {
        return $this->image ? getS3PublicUrl($this->image) : null;
    }

    public function getVideoFileUrlAttribute()
    {
        return $this->video ? Storage::url($this->video) : null;
    }

    public function getVideoUrlAttribute()
    {
        if ($this->video) {
            return Storage::url($this->video);
        }
        return $this->attributes['video_url'] ?? null;
    }

    public function getRemainingBudgetAttribute()
    {
        return $this->total_budget ? ($this->total_budget - $this->spent_amount) : null;
    }

    public function getRemainingImpressionsAttribute()
    {
        return $this->max_impressions ? ($this->max_impressions - $this->impressions_count) : null;
    }

    public function getRemainingClicksAttribute()
    {
        return $this->max_clicks ? ($this->max_clicks - $this->clicks_count) : null;
    }

    public function getProgressPercentageAttribute()
    {
        if (!$this->total_budget)
            return 0;
        return min(100, ($this->spent_amount / $this->total_budget) * 100);
    }

    public function isActive()
    {
        return $this->is_active &&
            $this->status === 'approved' &&
            (!$this->start_date || $this->start_date <= now()) &&
            (!$this->end_date || $this->end_date >= now()) &&
            (!$this->max_impressions || $this->impressions_count < $this->max_impressions) &&
            (!$this->max_clicks || $this->clicks_count < $this->max_clicks) &&
            (!$this->total_budget || $this->spent_amount < $this->total_budget);
    }

    public function scopeByPosition($query, $position)
    {
        return $query->where('position', $position);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    public function recordImpression()
    {
        $this->increment('impressions_count');

        if ($this->cost_per_impression) {
            $this->increment('spent_amount', $this->cost_per_impression);
        }
    }

    public function recordClick()
    {
        $this->increment('clicks_count');

        if ($this->cost_per_click) {
            $this->increment('spent_amount', $this->cost_per_click);
        }
    }

    public function calculateCTR()
    {
        if ($this->impressions_count === 0)
            return 0;
        return ($this->clicks_count / $this->impressions_count) * 100;
    }

    public function approve()
    {
        $this->update(['status' => 'approved']);
    }

    public function reject()
    {
        $this->update(['status' => 'rejected']);
    }

    public function pause()
    {
        $this->update(['is_active' => false]);
    }

    public function resume()
    {
        $this->update(['is_active' => true]);
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeBanner($query)
    {
        return $query->where('type', 'banner');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', 1);
    }
}