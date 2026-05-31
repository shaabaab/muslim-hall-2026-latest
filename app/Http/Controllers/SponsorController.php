<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Sponsor;
use App\Models\User;
use App\Models\Language;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class SponsorController extends Controller
{
    public function index(Request $request)
    {
        $query = Sponsor::with('user');

        // Search functionality using when
        $query->when($request->filled('search'), function ($q) use ($request) {
            $search = $request->search;
            $q->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('phone_alternative', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        });

        // Filter by email verification status
        $query->when($request->filled('email_verified'), function ($q) use ($request) {
            if ($request->email_verified === 'verified') {
                $q->whereNotNull('email_verified_at');
            } elseif ($request->email_verified === 'unverified') {
                $q->whereNull('email_verified_at');
            }
        });

        // Sorting
        $sortField = $request->get('sort_field', 'id');
        $sortDirection = $request->get('sort_direction', 'desc');

        // Validate sort field to prevent SQL injection
        $allowedSortFields = ['id', 'name', 'email', 'email_verified_at', 'created_at'];
        if (!in_array($sortField, $allowedSortFields)) {
            $sortField = 'id';
        }

        $query->orderBy($sortField, $sortDirection);

        // Pagination
        $sponsors = $query
            ->where('user_id', Auth::id())
            ->paginate($request->get('per_page', 10))->withQueryString();

        return Inertia::render('Sponsor/Index', [
            'sponsors' => $sponsors,
            'filters' => $request->only(['search', 'email_verified', 'sort_field', 'sort_direction']),
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

        return Inertia::render('Sponsor/Create', [
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
            'email' => 'nullable|string|email|max:255|unique:sponsors|unique:users',
            'password' => 'nullable|string|min:8|confirmed',
            'phone' => 'nullable|string|max:20',
            'phone_alternative' => 'nullable|string|max:20',
            'photo' => 'nullable|image',
            'website' => 'nullable|url|max:255',
        ]);

        // Handle sponsor photo upload
        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('sponsors');
        }

        // Start database transaction to ensure both operations succeed or fail together
        \DB::transaction(function () use ($request, $photoPath) {
            // Create User first
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

            // Update user with sponsor_id if you have that column in users table
            $user->update(['sponsor_id' => $sponsor->id]);
        });

        return to_route('admin.sponsors.index')->with('success', 'Sponsor and User account created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $sponsor = Sponsor::with('user.roles')->findOrFail($id);
        return Inertia::render('Sponsor/Show', ['sponsor' => $sponsor]);
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

        return Inertia::render('Sponsor/Edit', [
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

        $validationRules = [
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'phone_alternative' => 'nullable|string|max:20',
            'photo' => 'nullable|image',
            'website' => 'nullable|url|max:255',
            'remove_photo' => 'nullable|boolean',
        ];

        // Only validate password if provided
        if ($request->filled('password')) {
            $validationRules['password'] = 'sometimes|string|min:8|confirmed';
        }

        // Validate the request
        $validatedData = $request->validate($validationRules);

        // Use transaction for data consistency
        DB::transaction(function () use ($request, $sponsor, $validatedData) {
            // Handle photo removal if requested
            if ($request->boolean('remove_photo')) {
                if ($sponsor->photo && Storage::exists($sponsor->photo)) {
                    Storage::delete($sponsor->photo);
                }
                $sponsor->photo = null;
            }
            // Handle new photo upload
            elseif ($request->hasFile('photo')) {
                // Delete old photo if exists
                if ($sponsor->photo && Storage::exists($sponsor->photo)) {
                    Storage::delete($sponsor->photo);
                }
                $photoPath = $request->file('photo')->store('sponsors');
                $sponsor->photo = $photoPath;
            }

            // Update sponsor data
            $sponsor->name = $validatedData['name'];
            $sponsor->phone = $validatedData['phone'] ?? null;
            $sponsor->phone_alternative = $validatedData['phone_alternative'] ?? null;
            $sponsor->website = $validatedData['website'] ?? null;

            // Update password if provided
            if ($request->filled('password')) {
                $sponsor->password = Hash::make($request->password);
            }

            $sponsor->save();

            // Update associated user
            if ($sponsor->user) {
                $userData = [
                    'name' => $validatedData['name'],
                ];

                // Update user password if provided
                if ($request->filled('password')) {
                    $userData['password'] = Hash::make($request->password);
                }

                $sponsor->user->update($userData);
            }
        });

        return redirect()->route('admin.sponsors.index')->with('success', 'Sponsor updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $sponsor = Sponsor::with('user')->findOrFail($id);

        DB::transaction(function () use ($sponsor) {

            if ($sponsor->photo && Storage::exists($sponsor->photo)) {
                Storage::delete($sponsor->photo);
            }

            $sponsor->delete();
        });

        return redirect()->route('admin.sponsors.index')->with('success', 'Sponsor and associated user account deleted successfully.');
    }

    /**
     * Verify sponsor email
     */
    public function verifyEmail(string $id)
    {
        $sponsor = Sponsor::with('user')->findOrFail($id);

        \DB::transaction(function () use ($sponsor) {
            $sponsor->email_verified_at = now();
            $sponsor->save();

            // Also verify user email
            if ($sponsor->user) {
                $sponsor->user->email_verified_at = now();
                $sponsor->user->save();
            }
        });

        return redirect()->back()->with('success', 'Sponsor email verified successfully.');
    }

    /**
     * Unverify sponsor email
     */
    public function unverifyEmail(string $id)
    {
        $sponsor = Sponsor::with('user')->findOrFail($id);

        \DB::transaction(function () use ($sponsor) {
            $sponsor->email_verified_at = null;
            $sponsor->save();

            // Also unverify user email
            if ($sponsor->user) {
                $sponsor->user->email_verified_at = null;
                $sponsor->user->save();
            }
        });

        return redirect()->back()->with('success', 'Sponsor email unverified successfully.');
    }

    /**
     * Get sponsor by user ID
     */
    public function getByUser($userId)
    {
        $sponsor = Sponsor::where('user_id', $userId)->firstOrFail();
        return response()->json($sponsor);
    }
}