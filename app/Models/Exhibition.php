<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;
use App\Traits\HasSeo;


class Exhibition extends Model
{
    use HasFactory, SoftDeletes, HasSeo;

    const TYPE_PAINTING = 'painting';
    const TYPE_SCULPTURE = 'sculpture';
    const TYPE_PHOTOGRAPHY = 'photography';
    const TYPE_DIGITAL_ART = 'digital_art';

    const STATUS_DRAFT = 'draft';
    const STATUS_PUBLISHED = 'published';
    const STATUS_SOLD = 'sold';

    protected $fillable = [
        'user_id',
        'title',
        'description',
        'type',
        'image',
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
        'published_at',
        'slug',
    ];

    protected $casts = [
        'gallery' => 'array',
        'is_available' => 'boolean',
        'is_featured' => 'boolean',
        'published_at' => 'datetime',
        'price' => 'decimal:2',
    ];

    protected static function booted()
    {
        static::retrieved(function ($exhibition) {
            if (request()->ip()) {
                $viewerIps = json_decode($exhibition->viewer_ips ?? '[]', true);

                if (!in_array(request()->ip(), $viewerIps)) {
                    $viewerIps[] = request()->ip();
                    $exhibition->viewer_ips = json_encode($viewerIps);
                    $exhibition->increment('views');
                    $exhibition->save(); // Important: save the changes
                }
            }
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class)->with('subscriptions');
    }

    public function getImageUrlAttribute()
    {
        return $this->image ? Storage::url($this->image) : null;
    }

    public function getDocumentUrlAttribute()
    {
        return $this->document_file ? Storage::url($this->document_file) : null;
    }

    public function getGalleryUrlsAttribute()
    {
        if (!$this->gallery)
            return collect();

        return collect($this->gallery)->map(function ($image) {
            return Storage::url($image);
        });
    }

    public function scopePublished($query)
    {
        return $query->where('status', 'published')
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

    public function markAsSold()
    {
        $this->update([
            'status' => 'sold',
            'is_available' => false
        ]);
    }

    public function publish()
    {
        $this->update([
            'status' => 'published',
            'published_at' => now()
        ]);
    }


    public function comments()
    {
        return $this->hasMany(ExhibitionComment::class)->whereNull('parent_id')->with('user', 'replies');
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


    //search scope
    public function scopeSearch($query, $term)
    {
        $term = "%$term%";
        $query->where(function ($q) use ($term) {
            $q->where('title', 'like', $term)
                ->orWhere('description', 'like', $term);
        });
    }

    //sorted by type scope

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


    //status query scope
    public function scopeStatus($query, $status)
    {
        return $query->where('status', $status);
    }


    //type query scope
    public function scopeType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function language()
    {
        return $this->belongsTo(Language::class, 'lang_id', 'id');
    }

}