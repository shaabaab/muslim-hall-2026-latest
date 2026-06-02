<?php

namespace App\Providers;

use App\Models\Report;
use Illuminate\Support\ServiceProvider;
use Inertia\Inertia;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $isSecure = request()->isSecure() || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');

        if (app()->environment('production') || $isSecure || str_contains(config('app.url'), 'https://')) {
            \Illuminate\Support\Facades\URL::forceScheme('https');
        }

        Inertia::share([
        'reportCount' => function () {
            return Report::where('status', 'pending')->count(); // pending count
            // চাইলে total: return Report::count();
        },
    ]);
}
}
