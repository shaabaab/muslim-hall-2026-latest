<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use App\Models\Community;
use App\Models\Entry;
use App\Models\Exhibition;
use App\Models\Post;
use App\Models\User;
use App\Services\ServiceClass;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();
        if (Auth::user()->role == User::ROLE_USER) {
            return Inertia::render('Profile/UserProfileEdit', [
                'user' => $user,
                'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
                'status' => session('status'),
            ]);
        }

        return Inertia::render('Profile/Edit', [
            'user' => $user,
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
        ]);
    }


    public function userList(Request $request): Response
    {
        $users = User::withCount(['followers', 'followings'])->get();

        return Inertia::render('Profile/UserList', [
            'users' => $users,
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {

        $request->user()->fill($request->validated());
         //dd($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }
        if ($request->boolean('remove_photo')) {
            ServiceClass::deleteFile($request->user()->getOriginal('photo'));
            $request->user()->photo = null;
        }

        // ── Photo: upload new (mirrors thumbnail in PostController) ────
        if ($request->hasFile('photo')) {
            $request->user()->photo = ServiceClass::uploadFile(
                $request->file('photo'),
                'users/photos',
                $request->user()->getOriginal('photo') // deletes old file automatically
            );
        }
        $request->user()->save();

        if (Auth::user()->role == User::ROLE_ADMIN) {
            return Redirect::route('admin.profile.edit');
        }

        return Redirect::route('user.profile.edit');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }

    //show user profile

    public function show($id)
    {
        $user = User::with('badges')->findOrFail($id);

        $user->loadCount(['followers', 'followings']);
        $contests = Entry::with(['contest', 'user', 'review', 'winner'])
            ->where('user_id', $user->id)
            ->latest()
            ->limit(5)
            ->get();

        $exhibitions = Exhibition::where('user_id',  $user->id)->with('user')->latest()->limit(5)->get();
        $communitys = Community::where('user_id', $user->id)->with(['user'])->published()->latest()->limit(5)->get();
        $posts =  Post::with(['images', 'audios'])->where('created_by', $user->id)->withCount(['allComments', 'userReaction'])->latest()->limit(5)->get();


        return Inertia::render('UserNavSection/Profile/Show', [
            'user' => $user,
            'followers' => $user->followers()->withCount(['followers', 'followings'])->get(),
            'following' => $user->followings()->withCount(['followers', 'followings'])->get(),
            'posts' => $posts,
            'contests' => $contests,
            'exhibitions' => $exhibitions,
            'communitys' => $communitys,
            'userStats' => [
                'total_entries' => $user->entries()->count(),
                'total_votes' => $user->votes()->count(),
                'total_contests' => $user->participatedContests()->count(),
                'wins' => $user->participatedContests()->whereHas('winners', function ($query) use ($user) {
                    $query->whereIn('entry_id', $user->entries()->pluck('id'));
                })->count(),
            ]
        ]);
    }
}
