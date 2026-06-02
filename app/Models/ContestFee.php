<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ContestFee extends Model
{
    use HasFactory;


    protected $fillable = [
        'payment_method',
        'transaction_id',
        'status',
        'amount',
        'contest_id',
        'sponsor_id',
        'user_id',
    ];


    //relationship with Contest
    public function contest()
    {
        return $this->belongsTo(Contest::class);
    }


    //relationship with Sponsor
    public function sponsor()
    {
        return $this->belongsTo(Sponsor::class);
    }


    //relationship with User
    public function user()
    {
        return $this->belongsTo(User::class);
    }

}
