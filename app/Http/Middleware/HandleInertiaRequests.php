<?php

namespace App\Http\Middleware;

use Closure;

use App\Models\User;
use App\Models\Social;
use App\Models\Setting;
use Inertia\Middleware;
use App\Models\ContactInfo;
use App\Models\Subscription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Add cache-control headers to prevent BfCache / Session bleed.
     */
    public function handle(Request $request, Closure $next)
    {
        $response = parent::handle($request, $next);

        if ($response instanceof \Symfony\Component\HttpFoundation\Response) {
            $response->headers->set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
            $response->headers->set('Pragma', 'no-cache');
            $response->headers->set('Expires', 'Sun, 02 Jan 1990 00:00:00 GMT');
        }

        return $response;
    }

    /**
     * Determine the current asset version.
     * In development, return null to disable version-mismatch 409 errors
     * (Vite HMR constantly changes the manifest, causing false conflicts).
     */
    public function version(Request $request): string|null
    {
        if (app()->environment('local')) {
            return null;
        }

        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    // public function share(Request $request): array
    // {
    //     return [
    //         ...parent::share($request),
    //         'auth' => [
    //             'user' => $request->user(),
    //         ],
    //     ];
    // }

    public function share(Request $request): array
    {
        $user = User::where('id', Auth::id())->first();
        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $user ? array_merge(
                    $user->only(['id', 'name', 'email', 'role', 'deposit', 'photo', 'bio']),
                    [
                        'photo_url' => $user->photo
                            ? Storage::disk(config('filesystems.default'))->url($user->photo)
                            : null,

                        'roles' => $user->roles()->get(['id', 'name'])->toArray(),

                        'permissions' => $user->getAllPermissions()
                            ->pluck('name')
                            ->toArray(),

                        'subscriptions' => $user->subscriptions()
                            ->with('plan')
                            ->get(),
                       // Line 92 (existing 'banner_color' definition)
//  'banner_color' => $request->user() 
//                     ? ($request->user()->role == User::ROLE_MEMBER ? '#DAA520' : null) 
//                     : null,    
                        
                    ]
                ) : null,

                'fullUser' => $user,
            ],
            // 'auth' => [
            //     'user' => $request->user() ? [
            //         'id' => $request->user()->id,
            //         'name' => $request->user()->name,
            //         'email' => $request->user()->email,
            //         'role' => $request->user()->role,
            //         'photo' => $request->user()->photo,
            //         'photo_url' => $request->user()->photo
            //             ? Storage::disk(config('filesystems.default'))->url($request->user()->photo)
            //             : null,
            //     ] : null,
            // ],
            // 'auth' => [
            //     'user' => $user ? array_merge(
            //         $user->only(['id', 'name', 'email', 'role', 'deposit']),
            //         [
            //             'roles' => $user->roles()->get(['id', 'name'])->toArray(),
            //             'permissions' => $user->getAllPermissions()->pluck('name')->toArray(),
            //             'subscriptions' => $user->subscriptions()->with('plan')->get(),
            //         ]
            //     ) : null,
            //     'fullUser' => $user,
            // ],
            'social' => Social::get(),
            'contactInfo' => ContactInfo::first(),
            'footer' => Setting::first(),
            'header' => Setting::first(),
            'settings' => Setting::first(),
            'storage_disk' => config('filesystems.default'),
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
        ]);
    }
}
