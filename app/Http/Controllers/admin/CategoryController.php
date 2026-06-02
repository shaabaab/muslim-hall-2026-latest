<?php

namespace App\Http\Controllers\admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\CategoryStoreRequest;
use App\Http\Requests\CategoryUpdateRequest;
use App\Models\Language;
use App\Models\Category;
use App\Services\ServiceClass;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $categories = Category::with(['language'])
            ->when($request->filled('search'), fn ($q) => $q->search($request->search))
            ->when($request->filled('status'), fn ($q) => $q->status($request->status))
            ->when($request->filled('lang_id'), fn ($q) => $q->langId($request->lang_id))
            ->orderByDesc('id')
            ->paginate($request->get('per_page', 10))
            ->withQueryString();

        // Attach S3/public URL for image (optional but helpful for frontend)
        $categories->getCollection()->transform(function ($cat) {
            $cat->img_url = ServiceClass::getFileUrl($cat->img);
            return $cat;
        });

        $languages = Language::active()->get(['id', 'name', 'code']);

        return Inertia::render('Category/Index', [
            'categories' => $categories,
            'filters' => $request->only(['search', 'status', 'lang_id', 'sort_field', 'sort_direction', 'per_page']),
            'languages' => $languages,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $langs = Language::active()->get();
        $categories = Category::activeWithParent()->get();

        return Inertia::render('Category/Create', [
            'langs' => $langs,
            'categories' => $categories
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(CategoryStoreRequest $request)
{
    $data = $request->validated();
    
    // Debug: Check what's in $data before model method
    \Log::info('Before storeCategory - data keys: ' . json_encode(array_keys($data)));
    \Log::info('Before storeCategory - img type: ' . gettype($data['img'] ?? 'not set'));
    if (isset($data['img']) && is_object($data['img'])) {
        \Log::info('Before storeCategory - img class: ' . get_class($data['img']));
    }

    // First, let the model method handle what it needs
    if (method_exists(Category::class, 'storeCategory')) {
        // Pass the original data with UploadedFile object
        $category = Category::storeCategory($data);
    } else {
        $category = Category::create($data);
    }

    // Handle image upload separately after category is created
    if ($request->hasFile('img')) {
        $path = ServiceClass::uploadFile($request->file('img'), 'categories');

        if (!$path) {
            return back()->with('error', 'Category image upload failed.')->withInput();
        }

        // Update the category with the image path
        $category->update(['img' => $path]);
        
        \Log::info('Category updated with image path: ' . $path);
    } else {
        \Log::info('Request has no file - check why');
    }

    return to_route('admin.categories.index')->with('success', 'Category created successfully.');
}

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        $categories = Category::activeWithParent()->get();
        $langs = Language::active()->get();
        $category = Category::findOrFail($id);

        $category->img_url = ServiceClass::getFileUrl($category->img);

        return Inertia::render('Category/Edit', [
            'langs' => $langs,
            'category' => $category,
            'categories' => $categories
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(CategoryUpdateRequest $request, string $id)
    {
        $category = Category::findOrFail($id);
        $data = $request->validated();

        // Replace image using ServiceClass (delete old + upload new)
        if ($request->hasFile('img')) {
            $newPath = ServiceClass::updateFile($request->file('img'), 'categories', $category->img);
            if (!$newPath) {
                return back()->with('error', 'Category image update failed.')->withInput();
            }
            $data['img'] = $newPath;
        } else {
            // keep old
            unset($data['img']);
        }

        $category->update($data);

        return to_route('admin.categories.index')->with('success', 'Category updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $category = Category::findOrFail($id);

        // Delete image from S3 via ServiceClass
        ServiceClass::deleteFile($category->img);

        $category->delete();

        return to_route('admin.categories.index')->with('success', 'Category deleted successfully.');
    }
}
