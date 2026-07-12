<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;
use App\Traits\HasSeo;
use App\Services\ServiceClass;


class IslamicZone extends Model
{
    use HasFactory, SoftDeletes, HasSeo;

    protected $fillable = [
        'user_id',
        'title',
        'description',
        'type',
        'audio_file',
        'video_file',
        'ebook_file',
        'image',
        'duration',
        'file_size',
        'author',
        'reciter',
        'language',
        'is_featured',
        'views',
        'downloads',
        'status',
        'content_text',
        'lang_id',
        'youtube_url',
        'gallery',
        'document_file',
        'calendar_type',
        'slug',
        'viewer_ips',
    ];

    protected $casts = [
        'is_featured' => 'boolean',
        'viewer_ips' => 'array',
        'gallery' => 'array',
    ];



    const TYPE_ISLAMIC_CONTENT = 'islamicContent';
    const TYPE_QURAN = 'quran';
    const TYPE_HADITH = 'hadith';
    const TYPE_CALENDAR = 'calendar';

    const STATUS_DRAFT = 'draft';
    const STATUS_PUBLISHED = 'published';
    const STATUS_ARCHIVED = 'archived';


    protected static function booted()
    {
        static::retrieved(function ($islamicZone) {
            if (request()->ip()) {
                $viewerIps = json_decode($islamicZone->viewer_ips ?? '[]', true);

                if (!in_array(request()->ip(), $viewerIps)) {
                    $viewerIps[] = request()->ip();
                    $islamicZone->viewer_ips = json_encode($viewerIps);
                    $islamicZone->increment('views');
                    $islamicZone->save(); 
                }
            }
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

        public function language()
    {
        return $this->belongsTo(Language::class, 'lang_id', 'id');
    }

    public function getFileUrlAttribute()
    {
        $file = $this->document_file ?: $this->audio_file ?: $this->video_file ?: $this->image;
        return $file ? ServiceClass::getFileUrl($file) : null;
    }

    public function getImageUrlAttribute()
    {
        return $this->image ? ServiceClass::getFileUrl($this->image) : null;
    }

    public function getThumbnailUrlAttribute()
    {
        return $this->image ? ServiceClass::getFileUrl($this->image) : null;
    }

    public function scopePublished($query)
    {
        return $query->where('status', self::STATUS_PUBLISHED);
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function comments()
    {
        return $this->hasMany(IslamicComment::class)->whereNull('parent_id')->with('user', 'replies');
    }

    public function allComments()
    {
        return $this->hasMany(IslamicComment::class)->with('user', 'replies');
    }

    public function reactions()
    {
        return $this->hasMany(IslamicReaction::class);
    }

    public function seo()
    {
        return $this->morphOne(Seo::class, 'seoable');
    }

    public function userReaction()
    {
        return $this->hasOne(IslamicReaction::class)->where('user_id', auth()->id());
    }

    public function videos()
    {
        return $this->hasMany(IslamicZoneVideo::class);
    }

    public function pdfs()
    {
        return $this->hasMany(IslamicZonePdf::class);
    }

    public function audios()
    {
        return $this->hasMany(IslamicZoneAudio::class);
    }
}