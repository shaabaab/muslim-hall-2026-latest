<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BlockedIp extends Model
{
    use HasFactory;

   protected $guarded = [];
   public function isBlocked(): bool
    {
        return (bool) $this->is_blocked;
    }
}
