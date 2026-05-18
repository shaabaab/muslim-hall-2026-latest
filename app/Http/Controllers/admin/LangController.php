<?php

namespace App\Http\Controllers\admin;

use App\Http\Controllers\Controller;
use App\Models\Language;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LangController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $langs = Language::when($request->filled('search'), fn($q) => $q->search($request->search))
                    ->when($request->filled('status'), fn($q) => $q->status($request->status))
                    ->orderByDesc('id')
                    ->paginate($request->get('per_page', 10))
                    ->withQueryString();

        return Inertia::render('Lang/Index', [
            'langs' => $langs,
            'filters' => $request->only(['search', 'status', 'per_page']),
        ]);

      
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Lang/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {

        // Validate the request data
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:languages',
            'code' => 'required|string|max:10|unique:languages',
            'status' => 'nullable|boolean',
        ]);

        if($request->status == null){
            $validated['status'] = Language::INACTIVE;
        }

        // Create a new language entry
        Language::create($validated);

        // Redirect to the languages index with a success message
        return to_route('admin.langs.index')->with('success', 'Language created successfully.');
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
        $lang = Language::findOrFail($id);
        return Inertia::render('Lang/Edit', ['lang' => $lang]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:languages,name,' . $id,
            'code' => 'required|string|max:10|unique:languages,code,' . $id,
            'status' => 'required|boolean',
        ]);

        $lang = Language::findOrFail($id);

        // Update the language entry
        $lang->update([
            'name' => $request->name,
            'code' => $request->code,
            'status' => $request->status,
        ]);

        return to_route('admin.langs.index')->with('success', 'Language updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $lang = Language::findOrFail($id);
        $lang->delete();

        return to_route('admin.langs.index')->with('success', 'Language deleted successfully.');

    }
}
