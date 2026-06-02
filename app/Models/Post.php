<?php

namespace App\Models;

use App\Notifications\NewPostNotification;
use App\Notifications\NewReportNotification;
use App\Notifications\PostApprovedNotification;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class Post extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'image',
        'content',
        'video',
        'video_url',
        'pdf',
        'audio',
        'category_id',
        'status',
        'viewer_count',
        'viewer_ips',
        'created_by',
        'updated_by',
        'pdf_content',
        'sponsor',
        'thumbnail',
        'lang_id',
        'permission'
    ];


    protected $casts = [
        'viewer_ips' => 'array',
    ];

    const STATUS_ACTIVE = 1;
    const STATUS_INACTIVE = 0;

    const PERMISSION_PENDING = 'pending';
    const PERMISSION_APPROVED = 'approved';
    const PERMISSION_REJECTED = 'rejected';

    public function images()
    {
        return $this->hasMany(PostImage::class);
    }

    public function videos()
    {
        return $this->hasMany(PostVideo::class);
    }

    public function pdfs()
    {
        return $this->hasMany(PostPdf::class);
    }

    public function audios()
    {
        return $this->hasMany(PostAudio::class);
    }

    // Relationship with Category model
    public function category()
    {
        return $this->belongsTo(Category::class, 'category_id')->with('parent');
    }

    // Relationship with Section model
    public function section()
    {
        return $this->belongsTo(Section::class, 'section_id');
    }


    // Relationship with Language model
    public function language()
    {
        return $this->belongsTo(Language::class, 'lang_id', 'id');
    }

    // created By
    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // update By
    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }


    protected static function booted()
{
    static::creating(function ($model) {
        $model->slug = self::generateUniqueSlug($model->title);
    });

    static::updating(function ($model) {
        if ($model->isDirty('title')) {
            $model->slug = self::generateUniqueSlug(
                $model->title,
                $model->id
            );
        }
    });

    static::deleting(function ($post) {
        DB::table('notifications')
            ->where(function ($query) use ($post) {
                $query->where('type', NewPostNotification::class)
                    ->where('data->post_id', $post->id);
            })
            ->orWhere(function ($query) use ($post) {
                $query->where('type', PostApprovedNotification::class)
                    ->where('data->post_id', $post->id);
            })
            ->orWhere(function ($query) use ($post) {
                $query->where('type', NewReportNotification::class)
                    ->where('data->reportable_type', Post::class)
                    ->where('data->reportable_id', $post->id);
            })
            ->delete();

        $post->reports()->delete();
    });
}

    protected static function generateUniqueSlug(string $title, $ignoreId = null): string
    {
        $slug = Str::slug($title);
        $originalSlug = $slug;

        $count = 1;

        while (
            static::where('slug', $slug)
            ->when($ignoreId, fn($q) => $q->where('id', '!=', $ignoreId))
            ->exists()
        ) {
            $slug = $originalSlug . '-' . $count++;
        }

        return $slug;
    }

    // protected static function booted()
    // {
    // static::retrieved(function ($post) {
    //     if (request()->ip()) {
    //         $viewerIps = json_decode($post->viewer_ips ?? '[]', true);

    //         if (!in_array(request()->ip(), $viewerIps)) {
    //             $viewerIps[] = request()->ip();
    //             $post->viewer_ips = json_encode($viewerIps);
    //             $post->increment('viewer_count');
    //             $post->save();
    //         }
    //     }
    // });
    // }



    // Polymorphic relationship with Seo model
    public function seo()
    {
        return $this->morphOne(Seo::class, 'seoable');
    }


    // Scope for searching posts
    public function scopeSearch($query, $search)
    {
        $query->where(function ($q) use ($search) {
            $q->where('title', 'like', "%{$search}%")
                ->orWhere('slug', 'like', "%{$search}%")
                ->orWhere('content', 'like', "%{$search}%")
                ->orWhereHas('category', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%");
                })
                ->orWhereHas('language', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%");
                });
        });
    }


    // Scope for filtering by status
    public function scopeStatus($query, $status)
    {
        return $query->where('status', $status);
    }


    //langId scope
    public function scopeLangId($query, $lang_id)
    {
        return $query->where('lang_id', $lang_id);
    }

    //sorted by type scope
    public function scopeSortByOption($query, $sort)
    {
        switch ($sort) {
            case 'newest':
                return $query->orderByDesc('id'); // Newest to oldest

            case 'oldest':
                return $query->orderBy('id'); // Oldest to newest

            case 'a_to_z':
                return $query->orderBy('title', 'asc'); // A → Z

            case 'z_to_a':
                return $query->orderBy('title', 'desc'); // Z → A

            default:
                return $query->orderByDesc('id'); // Default
        }
    }

public function reports()
{
    return $this->morphMany(Report::class, 'reportable');
}

    // storePost function
    // public static function storePost(array $data): Post
    // {
    //     $videoPath = null;
    //     $pdfPath = null;


    //     if ($data['video']) {
    //         $videoPath = ServiceClass::uploadFile($data['video'], 'posts/videos');
    //     }

    //     if ($data['pdf']) {
    //         $pdfPath = ServiceClass::uploadFile($data['pdf'], 'posts/pdfs');
    //     }

    //     return $post = self::create([
    //         'title' => $data['title'],
    //         'slug' => Str::slug($data['title']) . '-' . Str::random(4),
    //         'content' => $data['content'],
    //         'video' => $videoPath,
    //         'pdf' => $pdfPath,
    //         'video_url' => $data['video_url'] ?? null,
    //         'category_id' => $data['category_id'],
    //         'section_id' => $data['section_id'] ?? null,
    //         'status' => $data['status'] ?? null,
    //         'lang_id' => $data['lang_id'],
    //         'created_by' => auth()->id(),
    //     ]);


    // }



    // updatePost function
    // public function updatePost(array $data, Post $post): Post
    // {
    // $videoPath = $post->video;
    // $pdfPath = $post->pdf;

    // if (!empty($data['video'])) {
    //     $videoPath = ServiceClass::uploadUpdateFile(
    //         $data['video'],
    //         'posts/videos',
    //         $post->video
    //     );
    // }

    // if (!empty($data['pdf'])) {
    //     $pdfPath = ServiceClass::uploadUpdateFile(
    //         $data['pdf'],
    //         'posts/pdfs',
    //         $post->pdf
    //     );
    // }

    // $post->update([
    //     'title' => $data['title'],
    //     'slug' => Str::slug($data['title']) . '-' . Str::random(5),
    //     'content' => $data['content'],
    //     'video' => $videoPath,
    //     'pdf' => $pdfPath,
    //     'video_url' => $data['video_url'] ?? null,
    //     'category_id' => $data['category_id'],
    //     'section_id' => $data['section_id'] ?? null,
    //     'status' => $data['status'],
    //     'lang_id' => $data['lang_id'],
    //     'updated_by' => auth()->id(),
    // ]);

    // return $post->fresh();
    // }




    public function comments()
    {
        return $this->hasMany(PostComment::class)->whereNull('parent_id')->with('user', 'replies');
    }

    public function allComments()
    {
        return $this->hasMany(PostComment::class)->with('user', 'replies');
    }

    public function reactions()
    {
        return $this->hasMany(PostReaction::class)->with('user');
    }


    public function userReaction()
    {
        return $this->hasOne(PostReaction::class)->where('user_id', auth()->id());
    }



    // Relationship with User (author - alias for createdBy)
    public function author()
    {
        return $this->belongsTo(User::class, 'created_by');
    }


    //type query scope
    public function scopeType($query, $type)
    {
        return $query->where('type', $type);
    }


    // Add accessors for reaction counts
    public function getLikesCountAttribute()
    {
        return $this->reactions()->where('type', 'like')->count();
    }

    public function getLovesCountAttribute()
    {
        return $this->reactions()->where('type', 'love')->count();
    }

    public function getDislikesCountAttribute()
    {
        return $this->reactions()->where('type', 'dislike')->count();
    }
}
