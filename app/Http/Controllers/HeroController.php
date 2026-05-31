<?php

namespace App\Http\Controllers;

use App\Models\Hero;
use Inertia\Inertia;
use App\Models\Language;
use App\Services\ServiceClass;
use Illuminate\Support\Str;
use Illuminate\Http\Request;

class HeroController extends Controller
{
    public function index(Request $request)
    {
        $query = Hero::query();

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
        $heros = $query->paginate($request->get('per_page', 10))->withQueryString();

        // Get languages for filter dropdown
        $languages = Language::active()->get(['id', 'name', 'code']);

        // S3 url for frontend (optional)
        $heros->getCollection()->transform(function ($hero) {
            $hero->img_url = ServiceClass::getFileUrl($hero->img);
            return $hero;
        });

        return Inertia::render('Hero/Index', [
            'heros' => $heros,
            'filters' => $request->only(['search', 'status', 'language_id', 'sort_field', 'sort_direction']),
            'languages' => $languages,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $langs = Language::active()->get();
        $heros = Hero::activeWithParent()->get();

        return Inertia::render('Hero/Create', [
            'langs' => $langs,
            'heros' => $heros
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'required|boolean',
            'lang_id' => 'required|integer|exists:languages,id',
            'img' => 'nullable|image',
            'parent_id' => 'nullable|integer|exists:heros,id',
        ]);

        $imagePath = null;

        // Upload hero image to S3 via ServiceClass
        if ($request->hasFile('img')) {
            $imagePath = ServiceClass::uploadFile($request->file('img'), 'heros');

            if (!$imagePath) {
                return back()->with('error', 'Image upload failed (S3).')->withInput();
            }
        }

        Hero::create([
            'name' => $request->name,
            'slug' => Str::slug($request->name),
            'description' => $request->description,
            'status' => $request->status,
            'lang_id' => $request->lang_id,
            'img' => $imagePath,
            'parent_id' => $request->parent_id ?? null,
        ]);

        return to_route('admin.heros.index')->with('success', 'Hero created successfully.');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        $heros = Hero::activeWithParent()->get();
        $langs = Language::active()->get();
        $hero = Hero::findOrFail($id);

        $hero->img_url = ServiceClass::getFileUrl($hero->img);

        return Inertia::render('Hero/Edit', [
            'langs' => $langs,
            'hero' => $hero,
            'heros' => $heros
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
            'parent_id' => 'nullable|integer|exists:heros,id',
            'img' => 'nullable|image',
            'remove_img' => 'nullable|boolean',
        ]);

        $hero = Hero::findOrFail($id);

        // Remove image if requested
        if ($request->boolean('remove_img')) {
            ServiceClass::deleteFile($hero->img);
            $hero->img = null;
        }

        // Upload new hero image (delete old + upload new)
        if ($request->hasFile('img')) {
            $newPath = ServiceClass::updateFile($request->file('img'), 'heros', $hero->img);

            if (!$newPath) {
                return back()->with('error', 'Image upload failed (S3).')->withInput();
            }

            $hero->img = $newPath;
        }

        $hero->name = $request->name;
        $hero->slug = Str::slug($request->name);
        $hero->description = $request->description;
        $hero->status = $request->status;
        $hero->lang_id = $request->lang_id;
        $hero->parent_id = $request->parent_id ?? null;
        $hero->save();

        return redirect()->route('admin.heros.index')->with('success', 'Hero updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $hero = Hero::findOrFail($id);

        // Delete hero image from S3
        ServiceClass::deleteFile($hero->img);

        $hero->delete();

        return redirect()->route('admin.heros.index')->with('success', 'Hero deleted successfully.');
    }
}
