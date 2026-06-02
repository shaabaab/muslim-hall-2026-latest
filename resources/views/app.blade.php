<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    @if(isset($meta))
        <meta property="og:title" content="{{ $meta['title'] ?? 'Muslim Hall' }}">
        <meta property="og:description" content="{{ $meta['description'] ?? 'Muslim Hall - Your trusted platform' }}">
        @if(!empty($meta['image']))
            <meta property="og:image" content="{{ $meta['image'] }}">
            <meta property="og:image:secure_url" content="{{ $meta['image'] }}">
            <meta name="twitter:image" content="{{ $meta['image'] }}">
        @endif
        <meta property="og:url" content="{{ request()->fullUrl() }}">
        <meta property="og:type" content="article">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="{{ $meta['title'] ?? 'Muslim Hall' }}">
        <meta name="twitter:description" content="{{ $meta['description'] ?? 'Muslim Hall - Your trusted platform' }}">
    @else
        <meta property="og:title" content="Muslim Hall">
        <meta property="og:description" content="Muslim Hall - Your trusted platform">
        <meta property="og:type" content="website">
    @endif

    <title inertia>Muslim Hall</title>

    <link rel="shortcut icon" href="https://i.postimg.cc/wBjHncMV/Muslim-Hall-Logo-Design-1-1.png" type="image/x-icon">

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css"
        crossorigin="anonymous" referrerpolicy="no-referrer" />

    <link rel="stylesheet" href="{{ asset('assets/css/style.css') }}">

    <style>
        ::-webkit-scrollbar {
            width: 5px;
        }

        ::-webkit-scrollbar-track {
            background: #f1f1f1 !important;
        }

        ::-webkit-scrollbar-thumb {
            background: #b4b4b4 !important;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: #b4b4b4 !important;
        }

        * {
            outline: none !important;
            box-shadow: none !important;
        }

        *:focus,
        *:focus-visible,
        *:active {
            outline: none !important;
            box-shadow: none !important;
        }
    </style>

    {{-- <link rel="stylesheet" href="{{ asset('build/assets/app-BMY4z_I5.css') }}">
    <script src="{{ asset('build/assets/app-BaTRNeCQ.js') }}" type="module"></script> --}}

    @routes
    @viteReactRefresh
    @vite(['resources/js/app.jsx'])
    @inertiaHead
</head>

<body>
    @inertia
</body>

</html>
