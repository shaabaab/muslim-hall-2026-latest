<?php

namespace App\Models;

use App\Traits\HasSeo;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Exhibition extends Model
{
    use HasFactory, SoftDeletes, HasSeo;

    const TYPE_PRODUCT = 'product';
    const TYPE_DOCUMENT = 'document';
    const TYPE_ART = 'art';
    const TYPE_PHOTOGRAPHY = 'photography';
    const TYPE_CRAFT = 'craft';

    const STATUS_DRAFT = 'draft';
    const STATUS_PUBLISHED = 'published';
    const STATUS_SOLD = 'sold';
    const STATUS_ARCHIVED = 'archived';

    const APPROVAL_PENDING = 'pending';
    const APPROVAL_APPROVED = 'approved';
    const APPROVAL_REJECTED = 'rejected';

    protected $fillable = [
        'user_id',
        'exhibition_board_id',
        'title',
        'description',
        'type',
        'image',
        'sponsor_image',
        'gallery',
        'document_file',
        'price',
        'currency',
        'is_available',
        'is_featured',
        'dimensions',
        'material',
        'views',
        'likes_count',
        'status',
        'approval_status',
        'approved_at',
        'approved_by',
        'admin_note',
        'published_at',
        'slug',
        'lang_id',
        'link',
    ];

    protected $casts = [
        'gallery' => 'array',
        'is_available' => 'boolean',
        'is_featured' => 'boolean',
        'published_at' => 'datetime',
        'approved_at' => 'datetime',
        'price' => 'decimal:2',
    ];

    protected $appends = [
        'image_url',
        'sponsor_image_url',
        'document_url',
        'gallery_urls',
    ];

    protected static function booted()
    {
        static::retrieved(function ($exhibition) {
            if (request()->ip()) {
                $viewerIps = json_decode($exhibition->viewer_ips ?? '[]', true);

                if (!is_array($viewerIps)) {
                    $viewerIps = [];
                }

                if (!in_array(request()->ip(), $viewerIps)) {
                    $viewerIps[] = request()->ip();
                    $exhibition->viewer_ips = json_encode($viewerIps);
                    $exhibition->increment('views');
                    $exhibition->save();
                }
            }
        });
    }

    public function board()
    {
        return $this->belongsTo(ExhibitionBoard::class, 'exhibition_board_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class)->with('subscriptions');
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function getImageUrlAttribute()
    {
        return $this->image ? Storage::url($this->image) : null;
    }

    public function getSponsorImageUrlAttribute()
    {
        return $this->sponsor_image ? Storage::url($this->sponsor_image) : null;
    }

    public function getDocumentUrlAttribute()
    {
        return $this->document_file ? Storage::url($this->document_file) : null;
    }

    public function getGalleryUrlsAttribute()
    {
        if (!$this->gallery) {
            return [];
        }

        return collect($this->gallery)->map(function ($image) {
            return Storage::url($image);
        })->values()->toArray();
    }

    public function scopeApproved($query)
    {
        return $query->where('approval_status', self::APPROVAL_APPROVED);
    }

    public function scopeApprovalPending($query)
    {
        return $query->where('approval_status', self::APPROVAL_PENDING);
    }

    public function scopePublished($query)
    {
        return $query->where('status', self::STATUS_PUBLISHED)
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now());
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    public function scopeAvailable($query)
    {
        return $query->where('is_available', true);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function scopeSearch($query, $term)
    {
        $term = "%$term%";

        return $query->where(function ($q) use ($term) {
            $q->where('title', 'like', $term)
                ->orWhere('description', 'like', $term);
        });
    }

    public function scopeStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function scopeSortByOption($query, $sort)
    {
        switch ($sort) {
            case 'newest':
                return $query->orderByDesc('id');

            case 'oldest':
                return $query->orderBy('id');

            case 'title_asc':
            case 'a_to_z':
                return $query->orderBy('title', 'asc');

            case 'title_desc':
            case 'z_to_a':
                return $query->orderBy('title', 'desc');

            case 'price_asc':
                return $query->orderBy('price', 'asc');

            case 'price_desc':
                return $query->orderBy('price', 'desc');

            default:
                return $query->orderByDesc('id');
        }
    }

    public function markAsSold()
    {
        return $this->update([
            'status' => self::STATUS_SOLD,
            'is_available' => false,
        ]);
    }

    public function publish()
    {
        return $this->update([
            'status' => self::STATUS_PUBLISHED,
            'published_at' => now(),
        ]);
    }

    public function approve($adminId)
    {
        return $this->update([
            'approval_status' => self::APPROVAL_APPROVED,
            'approved_at' => now(),
            'approved_by' => $adminId,
            'admin_note' => null,
            'status' => self::STATUS_PUBLISHED,
            'published_at' => now(),
        ]);
    }

    public function reject($adminId, $note = null)
    {
        return $this->update([
            'approval_status' => self::APPROVAL_REJECTED,
            'approved_at' => null,
            'approved_by' => $adminId,
            'admin_note' => $note,
        ]);
    }

    public function comments()
    {
        return $this->hasMany(ExhibitionComment::class)
            ->whereNull('parent_id')
            ->with('user', 'replies');
    }

    public function allComments()
    {
        return $this->hasMany(ExhibitionComment::class)->with('user', 'replies');
    }

    public function reactions()
    {
        return $this->hasMany(ExhibitionReaction::class);
    }

    public function seo()
    {
        return $this->morphOne(Seo::class, 'seoable');
    }

    public function userReaction()
    {
        return $this->hasOne(ExhibitionReaction::class)->where('user_id', auth()->id());
    }

    public function language()
    {
        return $this->belongsTo(Language::class, 'lang_id', 'id');
    }
}