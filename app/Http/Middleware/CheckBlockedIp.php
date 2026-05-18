<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\BlockedIp;
use Symfony\Component\HttpFoundation\Response;

class CheckBlockedIp
{
    public function handle(Request $request, Closure $next): Response
    {
        $ipAddress = $request->ip();

        $blockedIp = BlockedIp::where('ip_address', $ipAddress)->first();

        if ($blockedIp) {
            abort(403, 'আপনার IP অ্যাড্রেস ব্লক করা হয়েছে।');
        }


        return $next($request);
    }
}