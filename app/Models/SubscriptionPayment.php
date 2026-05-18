<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SubscriptionPayment extends Model
{
    use HasFactory;

    const STATUS_COMPLETED = 'completed';
    const STATUS_PENDING = 'pending';
    const STATUS_FAILED = 'failed';

    const STATUS_LABELS = [
        self::STATUS_COMPLETED => 'completed',
        self::STATUS_PENDING => 'pending',
        self::STATUS_FAILED => 'failed',
    ];  


    protected $fillable = [
        'subscription_id', 'payment_method', 'transaction_id', 'amount', 'status',
    ];

    public function subscription()
    {
        return $this->belongsTo(Subscription::class)->with(['user','plan']);
    }
}
