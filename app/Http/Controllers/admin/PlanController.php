<?php

namespace App\Http\Controllers\admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Plan;

class PlanController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Plan::query();

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where('name', 'like', "%{$search}%")
            ->orWhere('plan_type', 'like', "%{$search}%")
            ->orWhere('features', 'like', "%{$search}%")
            ->orWhere('description', 'like', "%{$search}%");
        }


        // Filter by status
        if ($request->has('status') && $request->status != '') {
            $query->where('status', $request->status);
        }

        // Filter by plan type
        if ($request->has('plan_type') && $request->plan_type != '') {
            $query->where('plan_type', $request->plan_type);
        }

        //pagination
        $perPage = $request->get('per_page', 10);
        $plans = $query->orderBy('id', 'desc')->paginate($perPage)->withQueryString();

        return Inertia::render('Plan/Index', [
            'plans' => $plans,
            'filters' => $request->only(['search', 'status','plan_type', 'per_page']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Plan/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        
       $request->validate([
           'name' => 'required|string|max:255',
           'description' => 'required|string',
           'status' => 'required|boolean',
           'validity' => 'required|integer|min:1',
           'plan_type' => 'required|in:1,2',
           'price' => 'required|numeric|min:0',
           'features' => 'nullable|array',
           'features.*' => 'string|max:255',
       ]);

       Plan::create($request->all());

        return to_route('admin.plans.index');
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
        
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        Plan::destroy($id);
        return redirect()->route('admin.plans.index');
    }
}
