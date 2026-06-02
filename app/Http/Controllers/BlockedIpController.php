<?php

namespace App\Http\Controllers;

use App\Models\User;
use Inertia\Inertia;
use App\Models\BlockedIp;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BlockedIpController extends Controller
{
public function index(Request $request)
{
    $query = BlockedIp::query();

    // Search functionality
    if ($request->has('search') && $request->search != '') {
        $search = $request->search;
        $query->where(function ($q) use ($search) {
            $q->where('ip_address', 'like', "%{$search}%")
                ->orWhere('reason', 'like', "%{$search}%");
        });
    }

    // Filter by block type (permanent vs temporary)
    if ($request->has('block_type') && $request->block_type != '') {
        switch ($request->block_type) {
            case 'permanent':
                $query->where('is_permanent', true);
                break;
            case 'temporary':
                $query->where('is_permanent', false)
                    ->where('blocked_until', '>', now());
                break;
            case 'expired':
                $query->where('is_permanent', false)
                    ->where('blocked_until', '<=', now());
                break;
            case 'active':
                $query->where(function ($q) {
                    $q->where('is_permanent', true)
                        ->orWhere('blocked_until', '>', now());
                });
                break;
        }
    }

    // Filter by block duration
    if ($request->has('duration') && $request->duration != '') {
        $now = now();
        switch ($request->duration) {
            case 'today':
                $query->whereDate('created_at', $now->toDateString());
                break;
            case 'week':
                $query->where('created_at', '>=', $now->copy()->subWeek());
                break;
            case 'month':
                $query->where('created_at', '>=', $now->copy()->subMonth());
                break;
            case 'year':
                $query->where('created_at', '>=', $now->copy()->subYear());
                break;
        }
    }

    // REMOVED: Filter by blocked by user since we don't have users data

    // Filter by IP address range (partial match)
    if ($request->has('ip_range') && $request->ip_range != '') {
        $query->where('ip_address', 'like', "{$request->ip_range}%");
    }

    // Sorting
    $sortField = $request->get('sort_field', 'id');
    $sortDirection = $request->get('sort_direction', 'desc');

    // Validate sort field to prevent SQL injection
    $allowedSortFields = ['id', 'ip_address', 'reason', 'blocked_until', 'is_permanent', 'created_at', 'updated_at'];
    if (!in_array($sortField, $allowedSortFields)) {
        $sortField = 'id';
    }

    $query->orderBy($sortField, $sortDirection);

    // Pagination
    $blockedIps = $query->paginate($request->get('per_page', 10))->withQueryString();

    return Inertia::render('BlockedIp/Index', [
        'blockedips' => $blockedIps, // Changed from 'blockedIps' to 'blockedips' to match your React component
        'filters' => $request->only(['search', 'block_type', 'duration', 'ip_range', 'sort_field', 'sort_direction']), // Removed 'blocked_by'
    ]);
}

    public function create()
    {
        $users = User::get(['id', 'name', 'email']);
        return Inertia::render('BlockedIp/Create', ['users' => $users]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'ip_address' => 'required|ip|unique:blocked_ips',
            'reason' => 'nullable|string|max:500',
            'is_permanent' => 'required|boolean',
            'blocked_until' => 'nullable|date|after:now',
        ]);

        // If it's permanent, set blocked_until to null
        $blockedUntil = $request->is_permanent ? null : $request->blocked_until;

        BlockedIp::create([
            'ip_address' => $request->ip_address,
            'reason' => $request->reason,
            'is_permanent' => $request->is_permanent,
            'blocked_until' => $blockedUntil,
            'blocked_by' => Auth::id() // Use authenticated user ID
        ]);

        return redirect()->route('admin.blockedips.index')
            ->with('success', 'IP address blocked successfully.');
    }

    public function edit(BlockedIp $blockedIp)
    {
        $users = User::get(['id', 'name', 'email']);
        return Inertia::render('BlockedIp/Edit', ['blockedIp' => $blockedIp,]);
    }

    public function update(Request $request, BlockedIp $blockedIp)
    {
        $request->validate([
            'ip_address' => 'required|ip|unique:blocked_ips,ip_address,' . $blockedIp->id,
            'reason' => 'required|string|max:500',
            'block_type' => 'required|in:permanent,temporary',
            'blocked_until' => 'required_if:block_type,temporary|date|after:now'
        ]);

        $blockedIp->update([
            'ip_address' => $request->ip_address,
            'reason' => $request->reason,
            'is_permanent' => $request->block_type === 'permanent',
            'blocked_until' => $request->block_type === 'temporary' ? $request->blocked_until : null
        ]);

        return redirect()->route('admin.blockedips.index')
            ->with('success', 'IP ব্লক সফলভাবে আপডেট করা হয়েছে।');
    }

    public function destroy($id)
    {
        $blockedIp = BlockedIp::find($id);
        
        $blockedIp->delete();

        return redirect()->route('admin.blockedips.index')
            ->with('success', 'IP ব্লক সফলভাবে মুছে ফেলা হয়েছে।');
    }
}
