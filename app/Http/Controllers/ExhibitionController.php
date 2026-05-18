<?php
namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Language;
use App\Models\Exhibition;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class ExhibitionController extends Controller
{
    public function index(Request $request)
    {
        $query = Exhibition::with('user')->latest();

        if ($request->has('search')) {
            $query->where('title', 'like', '%' . $request->search . '%')
                ->orWhere('description', 'like', '%' . $request->search . '%');
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $exhibitions = $query->paginate(12);

        return Inertia::render('Exhibition/Index', [
            'exhibitions' => $exhibitions,
            'filters' => $request->only(['search', 'type', 'status'])
        ]);
    }

    public function create()
    {
        $langs = Language::active()->get();
        return Inertia::render('Exhibition/Create', ['langs' => $langs]);
    }

    private function generateUniqueSlug($title, $ignoreId = null)
    {
        $slug = Str::slug($title);
        $query = Exhibition::where('slug', 'like', $slug . '%');

        if ($ignoreId) {
            $query->where('id', '!=', $ignoreId);
        }

        $count = $query->count();

        return $count > 0 ? $slug . '-' . ($count + 1) : $slug;
    }



    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:product,document,art,photography,craft',
            'image' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120',
            'gallery' => 'nullable|array',
            'gallery.*' => 'image|mimes:jpeg,png,jpg,gif|max:5120',
            'document_file' => 'nullable|file|mimes:pdf,doc,docx,ppt,pptx|max:20480',
            'price' => 'nullable|numeric|min:0',
            'is_available' => 'boolean',
            'is_featured' => 'boolean',
            'dimensions' => 'nullable|string|max:100',
            'material' => 'nullable|string|max:255',
            'status' => 'required|in:draft,published,sold,archived',
            'currency' => 'nullable|string|max:100',
        ]);

        // Handle main image upload
        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('exhibitions/images', 'public');
        }

        // Handle gallery images
        if ($request->hasFile('gallery')) {
            $galleryPaths = [];
            foreach ($request->file('gallery') as $image) {
                $galleryPaths[] = $image->store('exhibitions/gallery', 'public');
            }
            $validated['gallery'] = $galleryPaths;
        }

        // Handle document file
        if ($request->hasFile('document_file')) {
            $validated['document_file'] = $request->file('document_file')->store('exhibitions/documents', 'public');
        }

        // Set published_at if status is published
        if ($validated['status'] === 'published') {
            $validated['published_at'] = now();
        }
        $validated['slug'] = $this->generateUniqueSlug($request->title);
        $validated['lang_id'] = $request->lang_id;
        $validated['link'] = $request->link;
        $validated['currency'] = $request->currency;
        $validated['user_id'] = Auth::id();

        Exhibition::create($validated);

        return redirect()->route('admin.exhibitions.index')
            ->with('success', 'Exhibition item created successfully.');
    }

    public function frontStore(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:product,document,art,photography,craft',
            'image' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120',
            'gallery' => 'nullable|array',
            'gallery.*' => 'image|mimes:jpeg,png,jpg,gif|max:5120',
            'document_file' => 'nullable|file|mimes:pdf,doc,docx,ppt,pptx|max:20480',
            'price' => 'nullable|numeric|min:0',
            'is_available' => 'boolean',
            'is_featured' => 'boolean',
            'dimensions' => 'nullable|string|max:100',
            'currency' => 'nullable|string|max:100',
            'material' => 'nullable|string|max:255',
            'status' => 'required|in:draft,published,sold,archived',
        ]);

        // Handle main image upload
        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('exhibitions/images', 'public');
        }

        // Handle gallery images
        if ($request->hasFile('gallery')) {
            $galleryPaths = [];
            foreach ($request->file('gallery') as $image) {
                $galleryPaths[] = $image->store('exhibitions/gallery', 'public');
            }
            $validated['gallery'] = $galleryPaths;
        }

        // Handle document file
        if ($request->hasFile('document_file')) {
            $validated['document_file'] = $request->file('document_file')->store('exhibitions/documents', 'public');
        }

        // Set published_at if status is published
        if ($validated['status'] === 'published') {
            $validated['published_at'] = now();
        }
        $validated['slug'] = Str::slug($request->title) . '-' . Str::random(5);
        $validated['link'] = $request->link;
        $validated['currency'] = $request->currency;

        $validated['user_id'] = Auth::id();

        Exhibition::create($validated);

        return redirect()->back()
            ->with('success', 'Exhibition item created successfully.');
    }

    public function show(Exhibition $exhibition)
    {
        $exhibition->increment('views');
        $exhibition->load('user');

        return Inertia::render('Exhibition/Show', [
            'exhibition' => $exhibition
        ]);
    }

    public function edit(Exhibition $exhibition)
    {
        $langs = Language::active()->get();
        return Inertia::render('Exhibition/Edit', [
            'exhibition' => $exhibition,
            'langs' => $langs
        ]);
    }

    public function update(Request $request, Exhibition $exhibition)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:product,document,art,photography,craft',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
            'gallery' => 'nullable|array',
            'gallery.*' => 'image|mimes:jpeg,png,jpg,gif|max:5120',
            'document_file' => 'nullable|file|mimes:pdf,doc,docx,ppt,pptx|max:20480',
            'price' => 'nullable|numeric|min:0',
            'is_available' => 'boolean',
            'is_featured' => 'boolean',
            'dimensions' => 'nullable|string|max:100',
            'material' => 'nullable|string|max:255',
            'status' => 'required|in:draft,published,sold,archived',
            'currency' => 'required|string|max:10',
        ]);

        // Handle file updates
        $this->handleFileUpdates($request, $exhibition, $validated);

        // Update published_at if status changed to published
        if ($validated['status'] === 'published' && $exhibition->status !== 'published') {
            $validated['published_at'] = now();
        }

        // Update availability based on status
        if ($validated['status'] === 'sold') {
            $validated['is_available'] = false;
        }
        $validated['lang_id'] = $request->lang_id;
        $validated['link'] = $request->link;
        $exhibition->update($validated);

        return redirect()->route('admin.exhibitions.index', $exhibition)
            ->with('success', 'Exhibition item updated successfully.');
    }

    public function destroy(Exhibition $exhibition)
    {
        // Delete associated files
        $this->deleteFiles($exhibition);

        $exhibition->delete();

        return redirect()->route('admin.exhibitions.index')
            ->with('success', 'Exhibition item deleted successfully.');
    }

    public function toggleFeatured(Exhibition $exhibition)
    {
        $exhibition->update([
            'is_featured' => !$exhibition->is_featured
        ]);

        return back()->with('success', 'Featured status updated.');
    }

    public function markAsSold(Exhibition $exhibition)
    {
        $exhibition->markAsSold();

        return back()->with('success', 'Item marked as sold.');
    }

    private function handleFileUpdates($request, $exhibition, &$validated)
    {
        // Handle main image
        if ($request->hasFile('image')) {
            if ($exhibition->image) {
                Storage::disk('public')->delete($exhibition->image);
            }
            $validated['image'] = $request->file('image')->store('exhibitions/images', 'public');
        } else {
            $validated['image'] = $exhibition->image;
        }

        // Handle gallery images
        if ($request->hasFile('gallery')) {
            // Delete old gallery images
            if ($exhibition->gallery) {
                foreach ($exhibition->gallery as $oldImage) {
                    Storage::disk('public')->delete($oldImage);
                }
            }
            // Store new gallery images
            $galleryPaths = [];
            foreach ($request->file('gallery') as $image) {
                $galleryPaths[] = $image->store('exhibitions/gallery', 'public');
            }
            $validated['gallery'] = $galleryPaths;
        } else {
            $validated['gallery'] = $exhibition->gallery;
        }

        // Handle document file
        if ($request->hasFile('document_file')) {
            if ($exhibition->document_file) {
                Storage::disk('public')->delete($exhibition->document_file);
            }
            $validated['document_file'] = $request->file('document_file')->store('exhibitions/documents', 'public');
        } else {
            $validated['document_file'] = $exhibition->document_file;
        }
    }

    private function deleteFiles($exhibition)
    {
        if ($exhibition->image) {
            Storage::disk('public')->delete($exhibition->image);
        }

        if ($exhibition->gallery) {
            foreach ($exhibition->gallery as $image) {
                Storage::disk('public')->delete($image);
            }
        }

        if ($exhibition->document_file) {
            Storage::disk('public')->delete($exhibition->document_file);
        }
    }
}