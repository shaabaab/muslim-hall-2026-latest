<?php

namespace App\Http\Controllers;

use App\Models\Head;
use App\Models\Language;
use App\Services\ServiceClass;
use Inertia\Inertia;
use Illuminate\Support\Str;
use Illuminate\Http\Request;

class HeadController extends Controller
{
    public function index(Request $request)
    {
        $query = Head::query();

        // Search functionality
        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%")
                    ->orWhereHas('language', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%")
                            ->orWhere('code', 'like', "%{$search}%");
                    });
            });
        }

        // Filter by status
        if ($request->has('status') && $request->status != '') {
            $query->where('status', $request->status);
        }

        // Filter by language
        if ($request->has('lang_id') && $request->lang_id != '') {
            $query->where('lang_id', $request->lang_id);
        }

        // Sorting
        $sortField = $request->get('sort_field', 'id');
        $sortDirection = $request->get('sort_direction', 'desc');

        // Validate sort field to prevent SQL injection
        $allowedSortFields = ['id', 'name', 'slug', 'status', 'created_at'];
        if (!in_array($sortField, $allowedSortFields)) {
            $sortField = 'id';
        }

        $query->orderBy($sortField, $sortDirection);

        // Pagination
        $heads = $query->paginate($request->get('per_page', 10))->withQueryString();

        // Get languages for filter dropdown
        $languages = Language::active()->get(['id', 'name', 'code']);

        return Inertia::render('Head/Index', [
            'heads' => $heads,
            'filters' => $request->only(['search', 'status', 'language_id', 'sort_field', 'sort_direction']),
            'languages' => $languages,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Head/Create');
    }

    /**
     * Store a newly created resource in storage.
     * (S3 ServiceClass upload applied)
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'required|boolean',
            'lang_id' => 'required|integer|exists:languages,id',
            'img' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg',
            'parent_id' => 'nullable|integer|exists:heads,id',
        ]);

        $imagePath = null;

        // Upload to S3 via ServiceClass
        if ($request->hasFile('img')) {
            $imagePath = ServiceClass::uploadFile($request->file('img'), 'heads');
        }

        Head::create([
            'name' => $request->name,
            'slug' => Str::slug($request->name),
            'description' => $request->description,
            'status' => (bool) $request->status,
            'lang_id' => $request->lang_id,
            'img' => $imagePath,
            'parent_id' => $request->parent_id ?? null,
        ]);

        return to_route('admin.heads.index')->with('success', 'Head created successfully.');
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
        $heads = Head::activeWithParent()->get();
        $langs = Language::active()->get();
        $head = Head::findOrFail($id);

        return Inertia::render('Head/Edit', [
            'langs' => $langs,
            'head' => $head,
            'heads' => $heads
        ]);
    }

    /**
     * Update the specified resource in storage.
     * (S3 ServiceClass update applied)
     */
    public function update(Request $request, string $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'required|boolean',
            'lang_id' => 'required|integer|exists:languages,id',
            'img' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg',
            'parent_id' => 'nullable|integer|exists:heads,id',
        ]);

        $head = Head::findOrFail($id);

        // Replace image (delete old + upload new) via ServiceClass
        if ($request->hasFile('img')) {
            $newPath = ServiceClass::updateFile(
                $request->file('img'),
                'heads',
                $head->img
            );
            $head->img = $newPath;
        }

        $head->name = $request->name;
        $head->slug = Str::slug($request->name);
        $head->description = $request->description;
        $head->status = (bool) $request->status;
        $head->lang_id = $request->lang_id;
        $head->parent_id = $request->parent_id ?? null;
        $head->save();

        return redirect()->route('admin.heads.index')->with('success', 'Head updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     * (S3 ServiceClass delete applied)
     */
    public function destroy(string $id)
    {
        $head = Head::findOrFail($id);

        // Delete image from S3
        ServiceClass::deleteFile($head->img);

        $head->delete();

        return redirect()->route('admin.heads.index')->with('success', 'Head deleted successfully.');
    }
}
