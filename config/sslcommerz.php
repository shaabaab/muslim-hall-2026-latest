<?php

return [
    'store_id' => env('SSLCOMMERZ_STORE_ID'),
    'store_password' => env('SSLCOMMERZ_STORE_PASSWORD'),
    'sandbox' => env('SSLCOMMERZ_SANDBOX', true),

    'sandbox_init_url' => 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php',
    'live_init_url' => 'https://securepay.sslcommerz.com/gwprocess/v4/api.php',

    'sandbox_validation_url' => 'https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php',
    'live_validation_url' => 'https://securepay.sslcommerz.com/validator/api/validationserverAPI.php',
];