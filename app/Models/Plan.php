<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Plan extends Model
{
    use HasFactory;

    const PLAN_FREE = 1;
    const PLAN_PAID = 2;

   protected $fillable = [
        'name', 'price', 'validity', 'plan_type', 'description', 'features', 'status','total_sell'
    ];

    protected $casts = [
        'features' => 'array',
    ];

    //status constants
    const STATUS_ACTIVE = 1;
    const STATUS_INACTIVE = 2;

    public static function getStatusList()
    {
        return [
            self::STATUS_ACTIVE => 'Active',
            self::STATUS_INACTIVE => 'Inactive',
        ];
    }



    public function subscriptions()
    {
        return $this->hasMany(Subscription::class);
    }

    //scope for active plans
    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    
    }

    
}
