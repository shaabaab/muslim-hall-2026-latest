<?php

namespace App\Models;

use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Support\Carbon;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles;

    // protected $guard_name = 'web';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */



    const STATUS_INACTIVE = 0;
    const STATUS_ACTIVE = 1;
    const STATUS_PENDING = 2;
    const STATUS_SUSPENDED = 3;

    const ROLE_USER = 1;
    const ROLE_ADMIN = 2;
    const ROLE_ADMINVIEWER = 3;

    protected $fillable = [
        'name',
        'email',
        'password',
        'registration_ip',
        'last_login_ip',
        'status',
        'role',
        'parent_id',
        'photo',
        'bio',
        'phone',
        'phone_alternative',
        'type',
        'google_id',
        'last_login_date',
        'registration_date',
        'deposit',
        'last_seen_at',
    ];

    //     const ROLE_USER = 0;
    // const ROLE_MEMBER = 1;


    /**
     * The "booted" method of the model.
     *
     * @return void
     */
    protected static function booted()
    {
        static::creating(function ($user) {
            // Set registration_date when creating a new user
            if (empty($user->registration_date)) {
                $user->registration_date = Carbon::now();
            }

            // Set registration_ip if not set and request is available
            if (empty($user->registration_ip) && request()) {
                $user->registration_ip = request()->ip();
            }
        });

        static::updating(function ($user) {
            // If the user is logging in (password matches or via Sanctum), update last_login_date
            // This is typically handled in your login controller
        });
    }

    /**
     * Update last login information
     *
     * @param string|null $ip
     * @return void
     */
    public function updateLastLogin($ip = null)
    {
        $this->update([
            'last_login_date' => Carbon::now(),
            'last_login_ip' => $ip ?? request()->ip()
        ]);
    }

    // Optional: accessors for easy reading
    public function getStatusLabelAttribute()
    {
        return [
            0 => 'Inactive',
            1 => 'Active',
            2 => 'Pending',
            3 => 'Suspended',
        ][$this->status] ?? 'Unknown';
    }

    public function getRoleLabelAttribute()
    {
        return [
            1 => 'User',
            2 => 'Admin',
            3 => 'Admin Viewer',
        ][$this->role] ?? 'Unknown';
    }





    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'last_login_date' => 'datetime',
        'registration_date' => 'datetime',
        'last_seen_at' => 'datetime',
    ];

    /**
     * Automatically append permissions when model is serialized.
     *
     * @var array<int, string>
     */
    protected $appends = ['permissions'];

    /**
     * Accessor for permissions.
     *
     * @return \Illuminate\Support\Collection
     */
    public function getPermissionsAttribute()
    {
        // If the user is not fully loaded or has no roles, return empty collection
        try {
            return $this->getAllPermissions()->pluck('name');
        } catch (\Exception $e) {
            return collect([]);
        }
    }

    // Relationships (assuming related models exist)
    public function votes()
    {
        return $this->hasMany(Vote::class);
    }

    //comments made by user
    public function comments()
    {
        return $this->hasMany(Comment::class, 'comment_by');
    }

    //reactions made by user
    public function reactions()
    {
        return $this->hasMany(Reaction::class, 'user_id');
    }


    public function followers()
    {
        // users who follow this user
        return $this->belongsToMany(User::class, 'follows', 'following_id', 'follower_id');
    }

    public function followings()
    {
        // users this user is following
        return $this->belongsToMany(User::class, 'follows', 'follower_id', 'following_id');
    }

    //contests created by user
    public function contests()
    {
        return $this->hasMany(Contest::class, 'created_by');
    }


    //participated contests
    public function participatedContests()
    {
        return $this->belongsToMany(Contest::class, 'entries', 'user_id', 'contest_id')->withTimestamps();
    }

    public function isFollowing(User $user)
    {
        return $this->followings()->where('following_id', $user->id)->exists();
    }



    //entries made by user
    public function entries()
    {
        return $this->hasMany(Entry::class, 'user_id');
    }



    //reviews given by user

    public function reviewsGiven()
    {
        return $this->hasMany(Review::class, 'reviewed_by');
    }

    //active scrope

    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }


    //subscrriptions
    public function subscriptions()
    {
        return $this->hasMany(Subscription::class)->with(['plan', 'payment'])->latest();
    }

    // badge relation
    public function badges()
    {
        return $this->belongsTo(Badge::class, 'badge_id', 'id');
    }


    //posts by user
    public function posts()
    {
        return $this->hasMany(Post::class, 'created_by')->with('category', 'language', 'reactions', 'seo', 'comments');
    }


    //islamic contents created by user
    public function islamicZone()
    {
        return $this->hasMany(IslamicZone::class, 'user_id');
    }

    //exibitions created by user
    public function exhibitions()
    {
        return $this->hasMany(Exhibition::class, 'user_id');
    }

    //communities created by user
    public function communities()
    {
        return $this->hasMany(Community::class, 'user_id');
    }

    public function sponsor()
    {
        return $this->hasOne(Sponsor::class);
    }
}
