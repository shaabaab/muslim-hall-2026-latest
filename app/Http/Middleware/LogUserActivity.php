<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class LogUserActivity
{
    /**
     * Handle an incoming request.
     * Updates the authenticated user's last_seen_at timestamp (throttled to 1 minute).
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::check()) {
            $user = Auth::user();
            // Throttle DB writes: only update if last_seen_at is older than 1 minute (or null)
            if (is_null($user->last_seen_at) || $user->last_seen_at->lt(now()->subMinute())) {
                $user->timestamps = false; // don't update updated_at
                $user->last_seen_at = now();
                $user->save();
            }
        }

        return $next($request);
    }
}
