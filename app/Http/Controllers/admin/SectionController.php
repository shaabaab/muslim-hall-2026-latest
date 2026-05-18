<?php

namespace App\Http\Controllers\admin;

use App\Http\Controllers\Controller;
use App\Models\Language;
use App\Models\Section;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;

class SectionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $sections = Section::with('language')->get();;
        return Inertia::render('Section/Index', ['sections' => $sections]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $langs = Language::active()->get();
        return Inertia::render('Section/Create', ['langs' => $langs]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|boolean',
            'lang_id' => 'required|integer|exists:languages,id',
        ]);

        if($request->status == null){
            $validated['status'] = Section::INACTIVE;
        }
        $validated['slug'] = Str::slug($request->name);

        Section::create($validated);

        return to_route('admin.sections.index')->with('success', 'Section created successfully.');
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
        $section = Section::findOrFail($id);
        $langs = Language::active()->get();

        return Inertia::render('Section/Edit', [
            'section' => $section->load('language'),
            'langs' => $langs,
        ]);

    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'required|boolean',
            'lang_id' => 'required|integer|exists:languages,id',
        ]);


        $section = Section::findOrFail($id);
        $section->name = $request->name;
        $section->slug = Str::slug($request->name);
        $section->description = $request->description;
        $section->status = $request->status;
        $section->lang_id = $request->lang_id;
        $section->save();

        return to_route('admin.sections.index')->with('success', 'Section updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $section = Section::findOrFail($id);
        $section->delete();

        return to_route('admin.sections.index')->with('success', 'Section deleted successfully.');
    }
}
