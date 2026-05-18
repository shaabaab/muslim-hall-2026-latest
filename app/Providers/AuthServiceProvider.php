<?php

namespace App\Providers;

// use Illuminate\Support\Facades\Gate;
use App\Policies\PostCommentPolicy;
use App\Policies\ExhibitionCommentPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        ExhibitionComment::class => ExhibitionCommentPolicy::class,
        PostComment::class => PostCommentPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        //
    }
}
