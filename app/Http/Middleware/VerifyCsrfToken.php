<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

class VerifyCsrfToken extends Middleware
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * @var array<int, string>
     */
    protected $except = [
        'upload/chunk',
        'sslcommerz/subscription/success',
        'sslcommerz/subscription/fail',
        'sslcommerz/subscription/cancel',
        'sslcommerz/subscription/ipn',
    ];
}
