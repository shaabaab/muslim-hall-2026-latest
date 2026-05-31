<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Language;
use App\Models\Exhibition;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use App\Services\ServiceClass;
use Illuminate\Support\Facades\Auth;

class ExhibitionController extends Controller
{
    public function index(Request $request)
    {
        $query = Exhibition::with('user')->latest();

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'like', '%' . $request->search . '%')
                    ->orWhere('description', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('approval_status')) {
            $query->where('approval_status', $request->approval_status);
        }

        $exhibitions = $query->paginate($request->get('per_page', 12))->withQueryString();

        $exhibitions->getCollection()->transform(function ($exhibition) {
            return $this->appendFileUrls($exhibition);
        });

        return Inertia::render('Exhibition/Index', [
            'exhibitions' => $exhibitions,
            'filters' => $request->only(['search', 'type', 'status', 'approval_status']),
        ]);
    }

    public function create()
    {
        $langs = Language::active()->get();

        return Inertia::render('Exhibition/Create', [
            'langs' => $langs,
        ]);
    }

    private function generateUniqueSlug($title, $ignoreId = null)
    {
        $slug = Str::slug(strip_tags($title));

        if (!$slug) {
            $slug = 'exhibition';
        }

        $query = Exhibition::where('slug', 'like', $slug . '%');

        if ($ignoreId) {
            $query->where('id', '!=', $ignoreId);
        }

        $count = $query->count();

        return $count > 0 ? $slug . '-' . ($count + 1) : $slug;
    }

    private function appendFileUrls($exhibition)
    {
        if (!$exhibition) {
            return $exhibition;
        }

        $exhibition->image_url = ServiceClass::getFileUrl($exhibition->image);
        $exhibition->document_file_url = ServiceClass::getFileUrl($exhibition->document_file);

        $galleryUrls = [];

        if (is_array($exhibition->gallery)) {
            foreach ($exhibition->gallery as $galleryImage) {
                $galleryUrls[] = [
                    'path' => $galleryImage,
                    'url' => ServiceClass::getFileUrl($galleryImage),
                ];
            }
        }

        $exhibition->gallery_urls = $galleryUrls;

        return $exhibition;
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:5000',
            'description' => 'nullable|string|max:10000',
            'type' => 'required|in:product,document,art,photography,craft',
            'image' => 'required|image',
            'gallery' => 'nullable|array',
            'gallery.*' => 'image',
            'document_file' => 'nullable|file',
            'price' => 'nullable|numeric|min:0',
            'is_available' => 'nullable|boolean',
            'is_featured' => 'nullable|boolean',
            'dimensions' => 'nullable|string|max:100',
            'material' => 'nullable|string|max:255',
            'status' => 'required|in:draft,published,sold,archived',
            'currency' => 'nullable|string|max:100',
            'lang_id' => 'nullable|exists:languages,id',
            'link' => 'nullable|string|max:1000',
        ]);

        if ($request->hasFile('image')) {
            $imagePath = ServiceClass::uploadFile($request->file('image'), 'exhibitions/images');

            if (!$imagePath) {
                return back()->with('error', 'Main image upload failed.')->withInput();
            }

            $validated['image'] = $imagePath;
        }

        if ($request->hasFile('gallery')) {
            $galleryPaths = [];

            foreach ($request->file('gallery') as $image) {
                $galleryPath = ServiceClass::uploadFile($image, 'exhibitions/gallery');

                if (!$galleryPath) {
                    foreach ($galleryPaths as $uploadedPath) {
                        ServiceClass::deleteFile($uploadedPath);
                    }

                    if (!empty($validated['image'])) {
                        ServiceClass::deleteFile($validated['image']);
                    }

                    return back()->with('error', 'Gallery image upload failed.')->withInput();
                }

                $galleryPaths[] = $galleryPath;
            }

            $validated['gallery'] = $galleryPaths;
        }

        if ($request->hasFile('document_file')) {
            $documentPath = ServiceClass::uploadFile($request->file('document_file'), 'exhibitions/documents');

            if (!$documentPath) {
                if (!empty($validated['image'])) {
                    ServiceClass::deleteFile($validated['image']);
                }

                if (!empty($validated['gallery']) && is_array($validated['gallery'])) {
                    foreach ($validated['gallery'] as $galleryImage) {
                        ServiceClass::deleteFile($galleryImage);
                    }
                }

                return back()->with('error', 'Document file upload failed.')->withInput();
            }

            $validated['document_file'] = $documentPath;
        }

        if ($validated['status'] === 'published') {
            $validated['published_at'] = now();
        }

        $validated['slug'] = $this->generateUniqueSlug(strip_tags($request->title));
        $validated['lang_id'] = $request->lang_id;
        $validated['link'] = $request->link;
        $validated['currency'] = $request->currency ?? 'USD';
        $validated['user_id'] = Auth::id();
        $validated['is_available'] = $request->boolean('is_available', true);
        $validated['is_featured'] = $request->boolean('is_featured', false);

        if (!isset($validated['approval_status'])) {
            $validated['approval_status'] = 'pending';
        }

        Exhibition::create($validated);

        return redirect()->route('admin.exhibitions.index')
            ->with('success', 'Exhibition item created successfully.');
    }

    public function frontStore(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:5000',
            'description' => 'nullable|string|max:10000',
            'type' => 'required|in:product,document,art,photography,craft',
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp,svg|max:5120',
            'gallery' => 'nullable|array',
            'gallery.*' => 'image|mimes:jpeg,png,jpg,gif,webp,svg|max:5120',
            'document_file' => 'nullable|file|mimes:pdf,doc,docx,ppt,pptx|max:20480',
            'price' => 'nullable|numeric|min:0',
            'is_available' => 'nullable|boolean',
            'is_featured' => 'nullable|boolean',
            'dimensions' => 'nullable|string|max:100',
            'currency' => 'nullable|string|max:100',
            'material' => 'nullable|string|max:255',
            'status' => 'required|in:draft,published,sold,archived',
            'lang_id' => 'nullable|exists:languages,id',
            'link' => 'nullable|string|max:1000',
        ]);

        if ($request->hasFile('image')) {
            $imagePath = ServiceClass::uploadFile($request->file('image'), 'exhibitions/images');

            if (!$imagePath) {
                return back()->with('error', 'Main image upload failed.')->withInput();
            }

            $validated['image'] = $imagePath;
        }

        if ($request->hasFile('gallery')) {
            $galleryPaths = [];

            foreach ($request->file('gallery') as $image) {
                $galleryPath = ServiceClass::uploadFile($image, 'exhibitions/gallery');

                if (!$galleryPath) {
                    foreach ($galleryPaths as $uploadedPath) {
                        ServiceClass::deleteFile($uploadedPath);
                    }

                    if (!empty($validated['image'])) {
                        ServiceClass::deleteFile($validated['image']);
                    }

                    return back()->with('error', 'Gallery image upload failed.')->withInput();
                }

                $galleryPaths[] = $galleryPath;
            }

            $validated['gallery'] = $galleryPaths;
        }

        if ($request->hasFile('document_file')) {
            $documentPath = ServiceClass::uploadFile($request->file('document_file'), 'exhibitions/documents');

            if (!$documentPath) {
                if (!empty($validated['image'])) {
                    ServiceClass::deleteFile($validated['image']);
                }

                if (!empty($validated['gallery']) && is_array($validated['gallery'])) {
                    foreach ($validated['gallery'] as $galleryImage) {
                        ServiceClass::deleteFile($galleryImage);
                    }
                }

                return back()->with('error', 'Document file upload failed.')->withInput();
            }

            $validated['document_file'] = $documentPath;
        }

        if ($validated['status'] === 'published') {
            $validated['published_at'] = now();
        }

        $validated['slug'] = Str::slug(strip_tags($request->title)) . '-' . Str::random(5);
        $validated['lang_id'] = $request->lang_id;
        $validated['link'] = $request->link;
        $validated['currency'] = $request->currency ?? 'USD';
        $validated['user_id'] = Auth::id();
        $validated['is_available'] = $request->boolean('is_available', true);
        $validated['is_featured'] = $request->boolean('is_featured', false);

        if (!isset($validated['approval_status'])) {
            $validated['approval_status'] = 'pending';
        }

        Exhibition::create($validated);

        return redirect()->back()
            ->with('success', 'Exhibition item created successfully.');
    }

    public function show(Exhibition $exhibition)
    {
        $exhibition->increment('views');
        $exhibition->load('user');

        $this->appendFileUrls($exhibition);

        return Inertia::render('Exhibition/Show', [
            'exhibition' => $exhibition,
        ]);
    }

    public function edit(Exhibition $exhibition)
    {
        $langs = Language::active()->get();

        $this->appendFileUrls($exhibition);

        return Inertia::render('Exhibition/Edit', [
            'exhibition' => $exhibition,
            'langs' => $langs,
        ]);
    }

    public function update(Request $request, Exhibition $exhibition)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:5000',
            'description' => 'nullable|string|max:10000',
            'type' => 'required|in:product,document,art,photography,craft',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp,svg|max:5120',
            'gallery' => 'nullable|array',
            'gallery.*' => 'image|mimes:jpeg,png,jpg,gif,webp,svg|max:5120',
            'document_file' => 'nullable|file|mimes:pdf,doc,docx,ppt,pptx|max:20480',
            'price' => 'nullable|numeric|min:0',
            'is_available' => 'nullable|boolean',
            'is_featured' => 'nullable|boolean',
            'dimensions' => 'nullable|string|max:100',
            'material' => 'nullable|string|max:255',
            'status' => 'required|in:draft,published,sold,archived',
            'currency' => 'required|string|max:100',
            'lang_id' => 'nullable|exists:languages,id',
            'link' => 'nullable|string|max:1000',
            'remove_gallery_images' => 'nullable|array',
            'remove_gallery_images.*' => 'nullable|string',
            'remove_document' => 'nullable|boolean',
        ]);

        $this->handleFileUpdates($request, $exhibition, $validated);

        if ($validated['status'] === 'published' && $exhibition->status !== 'published') {
            $validated['published_at'] = now();
        }

        if ($validated['status'] === 'sold') {
            $validated['is_available'] = false;
        } else {
            $validated['is_available'] = $request->boolean('is_available', true);
        }

        $validated['is_featured'] = $request->boolean('is_featured', false);
        $validated['lang_id'] = $request->lang_id;
        $validated['link'] = $request->link;
        $validated['slug'] = $this->generateUniqueSlug(strip_tags($request->title), $exhibition->id);

        $exhibition->update($validated);

        return redirect()->route('admin.exhibitions.index')
            ->with('success', 'Exhibition item updated successfully.');
    }

    public function destroy(Exhibition $exhibition)
    {
        $this->deleteFiles($exhibition);

        $exhibition->delete();

        return redirect()->route('admin.exhibitions.index')
            ->with('success', 'Exhibition item deleted successfully.');
    }

    public function toggleFeatured(Exhibition $exhibition)
    {
        $exhibition->update([
            'is_featured' => !$exhibition->is_featured,
        ]);

        return back()->with('success', 'Featured status updated.');
    }

    public function markAsSold(Exhibition $exhibition)
    {
        $exhibition->markAsSold();

        return back()->with('success', 'Item marked as sold.');
    }

    private function handleFileUpdates(Request $request, Exhibition $exhibition, array &$validated)
    {
        if ($request->hasFile('image')) {
            $newImagePath = ServiceClass::updateFile(
                $request->file('image'),
                'exhibitions/images',
                $exhibition->image
            );

            if (!$newImagePath) {
                throw new \RuntimeException('Main image upload failed.');
            }

            $validated['image'] = $newImagePath;
        } else {
            $validated['image'] = $exhibition->image;
        }

        $currentGallery = is_array($exhibition->gallery) ? $exhibition->gallery : [];

        if ($request->filled('remove_gallery_images')) {
            $removeGalleryImages = $request->input('remove_gallery_images', []);

            foreach ($removeGalleryImages as $removeGalleryImage) {
                if (in_array($removeGalleryImage, $currentGallery, true)) {
                    ServiceClass::deleteFile($removeGalleryImage);
                    $currentGallery = array_values(array_filter($currentGallery, function ($galleryImage) use ($removeGalleryImage) {
                        return $galleryImage !== $removeGalleryImage;
                    }));
                }
            }
        }

        if ($request->hasFile('gallery')) {
            foreach ($request->file('gallery') as $image) {
                $galleryPath = ServiceClass::uploadFile($image, 'exhibitions/gallery');

                if (!$galleryPath) {
                    throw new \RuntimeException('Gallery image upload failed.');
                }

                $currentGallery[] = $galleryPath;
            }
        }

        $validated['gallery'] = $currentGallery;

        if ($request->boolean('remove_document')) {
            if ($exhibition->document_file) {
                ServiceClass::deleteFile($exhibition->document_file);
            }

            $validated['document_file'] = null;
        } elseif ($request->hasFile('document_file')) {
            $newDocumentPath = ServiceClass::updateFile(
                $request->file('document_file'),
                'exhibitions/documents',
                $exhibition->document_file
            );

            if (!$newDocumentPath) {
                throw new \RuntimeException('Document file upload failed.');
            }

            $validated['document_file'] = $newDocumentPath;
        } else {
            $validated['document_file'] = $exhibition->document_file;
        }
    }

    private function deleteFiles(Exhibition $exhibition)
    {
        if ($exhibition->image) {
            ServiceClass::deleteFile($exhibition->image);
        }

        if ($exhibition->gallery && is_array($exhibition->gallery)) {
            foreach ($exhibition->gallery as $image) {
                ServiceClass::deleteFile($image);
            }
        }

        if ($exhibition->document_file) {
            ServiceClass::deleteFile($exhibition->document_file);
        }
    }

    public function approve(Exhibition $exhibition)
    {
        $exhibition->update([
            'approval_status' => 'approved',
            'approved_at' => now(),
            'approved_by' => Auth::id(),
            'admin_note' => null,
        ]);

        return back()->with('success', 'Exhibition approved successfully.');
    }

    public function reject(Request $request, Exhibition $exhibition)
    {
        $request->validate([
            'admin_note' => 'nullable|string|max:1000',
        ]);

        $exhibition->update([
            'approval_status' => 'rejected',
            'approved_at' => null,
            'approved_by' => Auth::id(),
            'admin_note' => $request->admin_note,
        ]);

        return back()->with('success', 'Exhibition rejected successfully.');
    }
}