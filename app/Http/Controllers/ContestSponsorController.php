<?php

namespace App\Http\Controllers;

use App\Http\Requests\ContestSponsorStore;
use App\Models\Contest;
use App\Models\ContestSponsor;
use App\Models\Sponsor;
use App\Models\User;
use App\Services\ServiceClass;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;

class ContestSponsorController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $sponsors = Sponsor::with('user')
                    ->where('user_id', Auth::id())
                    ->when($request->filled('search'), fn($q) => $q->search($request->search))
                    ->orderByDesc('id')
                    ->paginate($request->get('per_page', 10))
                    ->withQueryString();

        return Inertia::render('UserNavSection/Contest/Sponsor/Index', [
            'sponsors' => $sponsors,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $roles = Role::where('name', 'sponsor')->get()->map(function ($role) {
            return [
                'id' => $role->id,
                'name' => $role->name,
            ];
        });

        return Inertia::render('UserNavSection/Contest/Sponsor/Create', [
            'isEdit' => false,
            'roles' => $roles
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
   public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:sponsors|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'phone' => 'nullable|string|max:20',
            'phone_alternative' => 'nullable|string|max:20',
            'photo' => 'nullable|image',
            'website' => 'nullable|url|max:255',
        ]);

        // Handle sponsor photo upload
        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('sponsors', 'public');
        }

        // Start database transaction to ensure both operations succeed or fail together
        DB::transaction(function () use ($request, $photoPath) {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'registration_ip' => $request->ip(),
                'email_verified_at' => now()
         
            ]);

            // Assign sponsor role to user
            $sponsorRole = Role::where('name', 'sponsor')->first();
            if ($sponsorRole) {
                $user->assignRole($sponsorRole);
            }

            // Create Sponsor
            $sponsor = Sponsor::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => bcrypt($request->password),
                'phone' => $request->phone,
                'phone_alternative' => $request->phone_alternative,
                'photo' => $photoPath,
                'email_verified_at' => now(),
                'website' => $request->website,
                'user_id' => Auth::id(), 
            ]);

            $user->update(['sponsor_id' => $sponsor->id]);
        });

        return to_route('user.sponsors.index')->with('success', 'Sponsor and User account created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        $sponsor = Sponsor::with('user')->findOrFail($id);
        
        $roles = Role::where('name', 'sponsor')->get()->map(function ($role) {
            return [
                'id' => $role->id,
                'name' => $role->name,
            ];
        });

        return Inertia::render('UserNavSection/Contest/Sponsor/Create', [
            'sponsor' => $sponsor,
            'isEdit' => true,
            'roles' => $roles
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $sponsor = Sponsor::with('user')->findOrFail($id);

        $request->validate([
            'name' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'phone_alternative' => 'nullable|string|max:20',
            'photo' => 'nullable|image',
            'password' => 'nullable|string|min:8|confirmed',
        ]);

        DB::transaction(function () use ($request, $sponsor) {
            if ($request->hasFile('photo')) {
                if ($sponsor->photo && Storage::disk('public')->exists($sponsor->photo)) {
                    Storage::disk('public')->delete($sponsor->photo);
                }
                $photoPath = $request->file('photo')->store('sponsors', 'public');
                $sponsor->photo = $photoPath;
            }

            // Update sponsor data
            $sponsor->name = $request->name;
            $sponsor->email = $request->email;
            $sponsor->phone = $request->phone;
            $sponsor->website = $request->website;
            $sponsor->phone_alternative = $request->phone_alternative;

            // Update password if provided
            if ($request->filled('password')) {
                $sponsor->password = bcrypt($request->password);
            }

            $sponsor->save();

            if ($sponsor->user) {
                $userData = [
                    'name' => $request->name,
                    'email' => $request->email,
                ];

                if ($request->filled('password')) {
                    $userData['password'] = Hash::make($request->password);
                }

                $sponsor->user->update($userData);
            }
        });

        return to_route('user.sponsors.index')->with('success', 'Sponsor updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $sponsor = Sponsor::with('user')->findOrFail($id);
        DB::transaction(function () use ($sponsor) {
            if ($sponsor->photo && Storage::disk('public')->exists($sponsor->photo)) {
                Storage::disk('public')->delete($sponsor->photo);
            }

            $sponsor->delete();
        });

        return to_route('user.sponsors.index')->with('success', 'Sponsor and associated user account deleted successfully.');
    }
}
