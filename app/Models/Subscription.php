<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Subscription extends Model
{
    use HasFactory;

    const STATUS_ACTIVE = 1;
    const STATUS_EXPIRED = 2;
    const STATUS_CANCELLED = 3;
    const STATUS_PENDING = 4;

    const STATUS_LABELS = [
        self::STATUS_ACTIVE => 'active',
        self::STATUS_EXPIRED => 'expired',
        self::STATUS_CANCELLED => 'cancelled',
        self::STATUS_PENDING => 'pending',
    ];  

    protected $fillable = [
        'user_id', 'plan_id', 'start_date', 'end_date', 'status' , 'validity',
    ];


    protected static function booted()
    {
        static::created(function ($subscription) {
            if ($subscription->plan) {
                $subscription->plan->increment('total_sell', 1);
            }
        });
    }


    protected $dates = ['start_date', 'end_date'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function plan()
    {
        return $this->belongsTo(Plan::class);
    }

    public function payment()
    {
        return $this->hasOne(SubscriptionPayment::class);
    }

    // Helper: check if active
    public function isActive()
    {
        return $this->status === 'active' && $this->end_date->isFuture();
    }


    //local scope for active subscriptions
    public function scopeSearch($query, $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->orWhereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%");
            })
            ->orWhereHas('plan', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                ->orWhere('plan_type', 'like', "%{$search}%")
                ->orWhere('description', 'like', "%{$search}%")
                ->orWhere('features', 'like', "%{$search}%");
            });
        });
    }


    //local scope for status filtering
    public function scopeStatus($query, $status)
    {
        if ($status == 'active') {
            return $query->where('status', self::STATUS_ACTIVE);
        } elseif ($status == 'expired') {
            return $query->where('status', self::STATUS_EXPIRED);
        } elseif ($status == 'cancelled') {
            return $query->where('status', self::STATUS_CANCELLED);
        } elseif ($status == 'pending') {
            return $query->where('status', self::STATUS_PENDING);
        }
    }


    //plan_type scope
    public function scopePlanType($query, $plan_type)
    {
        return $query->whereHas('plan', function ($q) use ($plan_type) {
            $q->where('plan_type', $plan_type);
        });
    }




    
}
