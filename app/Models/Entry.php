<?php

namespace App\Models;

use App\Models\EntryImage;
use App\Notifications\NewReportNotification;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Entry extends Model
{
    use HasFactory;

    protected $fillable = [
        'contest_id',
        'user_id',
        'title',
        'content',
        'media_path',
        'total_votes',
        'status',
        'is_disqualified',
        'thumbnail',
        'image',
        'video',
        'audio',
        'pdf',
    ];

    const STATUS_PENDING = 'pending';
    const STATUS_APPROVED = 'approved';
    const STATUS_REJECTED = 'rejected';

    protected $casts = [
        'is_disqualified' => 'boolean',
    ];

    //local scopes
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }
    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    // Relationships (assuming related models exist)
    public function winner()
    {
        return $this->hasOne(Winner::class);
    }
    public function contest()
    {
        return $this->belongsTo(Contest::class)->with(['prizes', 'reviews', 'votes']);
    }
    public function user()
    {
        return $this->belongsTo(User::class);
    }
    public function votes()
    {
        return $this->hasMany(Vote::class)->with('user');
    }
    public function review()
    {
        return $this->hasOne(Review::class);
    }

    //reviews relation with reviewer
    public function reviews()
    {
        return $this->hasMany(Review::class)->with('reviewer');
    }
    public function images()
    {
        return $this->hasMany(EntryImage::class, 'entries_id');
    }

    public function reports()
    {
        return $this->morphMany(Report::class, 'reportable');
    }
    protected static function booted()
    {
        

        static::deleting(function ($entry) {
            DB::table('notifications')
               
               
                ->Where(function ($query) use ($entry) {
                    $query->where('type', NewReportNotification::class)
                        ->where('data->reportable_type', Entry::class)
                        ->where('data->reportable_id', $entry->id);
                })
                ->delete();

            $entry->reports()->delete();
        });
    }

    // search scope
    public function scopeSearch($query, $term)
    {
        $term = "%$term%";

        return $query->where(function ($q) use ($term) {
            $q->where('title', 'like', $term)
                ->orWhere('content', 'like', $term)
                ->orWhereHas('user', function ($q) use ($term) {
                    $q->where('name', 'like', $term)
                        ->orWhere('email', 'like', $term);
                })
                ->orWhereHas('contest', function ($q) use ($term) {
                    $q->where('title', 'like', $term)
                        ->orWhere('description', 'like', $term);
                });
        });
    }
}
