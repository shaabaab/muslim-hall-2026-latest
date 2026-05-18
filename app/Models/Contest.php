<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\HasSeo;


class Contest extends Model
{
    use HasFactory, HasSeo;

    protected $fillable = [
        'title',
        'type',
        'form_url',
        'formats',
        'description',
        'status',
        'admin_approval',
        'email',
        'link',
        'phone',
        'start_date',
        'end_date',
        'created_by',
        'voting_enabled',
        'category_id',
        'payment_type',
        'user_type',
        'amount',
        'sponsor_id',
         'viewer_count',
    'viewer_users',
    'viewer_ips'
    ];

    protected $casts = [
            'viewer_users' => 'array',
    'viewer_ips' => 'array',
];
    const STATUS_UPCOMING = 1;
    const STATUS_RUNNING  = 2;
    const STATUS_ENDED    = 3;
    const STATUS_ARCHIVED = 4;


    const CONTEST_ENABLED = 1;
    const CONTEST_DISABLED = 0;


    const PAYMENT_FREE = 'free';
    const PAYMENT_PAID = 'paid';

    const USER_TYPE_ALL    = 'all';
    const USER_TYPE_USER   = 'user';
    const USER_TYPE_MEMBER = 'member';

    public static function getStatusList()
    {
        return [
            self::STATUS_UPCOMING => 'Upcoming',
            self::STATUS_RUNNING  => 'Running',
            self::STATUS_ENDED    => 'Ended',
            self::STATUS_ARCHIVED => 'Archived',
        ];
    }

    //contest sponsor relation
    public function contestSponsor()
    {
        return $this->hasMany(ContestSponsor::class, 'contest_id')->with('sponsor');
    }

    // Relationships (assuming related models exist)
    public function prizes()
    {
        return $this->belongsToMany(Prize::class, 'contest_prize')->withTimestamps();
    }

    //contest fee relation
    public function contestFees()
    {
        return $this->hasMany(ContestFee::class);
    }

    // review relation with count
    public function reviewWithCount()
    {
        return $this->hasManyThrough(Review::class, Entry::class)->withCount('votes');
    }

    //contest category relation
    public function category()
    {
        return $this->belongsTo(ContestCategory::class, 'category_id')->with('parent');
    }



    //holed scope
    public function scopeIsOnHold($query, $is_on_hold)
    {
        return $query->where('voting_enabled', $is_on_hold);
    }

    //prizewithcount
    public function prizeWithCount()
    {
        return $this->hasMany(Prize::class)->withCount('winners');
    }

    public function entries()
    {
        return $this->hasMany(Entry::class)->with(['user', 'reviews', 'votes']);
    }
    public function reviews()
    {
        return $this->hasMany(Review::class)->with('reviewer');
    }
    public function archive()
    {
        return $this->hasOne(ArchivedContest::class);
    }
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
    public function winners()
    {
        return $this->hasMany(Winner::class)->with('entry.user');
    }


    //votes relation
    public function votes()
    {
        return $this->hasManyThrough(Vote::class, Entry::class);
    }

    //local scope for running contests
    public function scopeRunning($query)
    {
        return $query->where('status', self::STATUS_RUNNING)
            ->where('start_date', '<=', now())
            ->where('end_date', '>=', now());
    }

    // ended contests scope
    public function scopeEnded($query)
    {
        return $query->where('status', self::STATUS_ENDED);
    }

    public function scopeArchived($query)
    {
        return $query->where('status', self::STATUS_ARCHIVED);
    }

    //global scope to delete entries when delete contest
    // protected static function booted()
    // {
    //     static::deleting(function ($contest) {
    //         $contest->entries()->delete();
    //     });
    // }


    // Search scope
    public function scopeSearch($query, $search)
    {
        $query->where(function ($q) use ($search) {
            $q->where('title', 'like', "%{$search}%")
                ->orWhere('description', 'like', "%{$search}%")
                ->orWhereHas('category', function ($q2) use ($search) {
                    $q2->where('name', 'like', "%{$search}%");
                });
        });
    }

    //status scope
    public function scopeStatus($query, $status)
    {
        return $query->where('status', $status);
    }
}
