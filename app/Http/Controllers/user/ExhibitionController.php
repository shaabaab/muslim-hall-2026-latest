<?php

namespace App\Http\Controllers\user;

use Inertia\Inertia;
use App\Models\Language;
use App\Models\Exhibition;
use Illuminate\Support\Str;
use App\Models\Subscription;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class ExhibitionController extends Controller
{
    public function index(Request $request)
    {

        $user = User::find(Auth::id());
        $isMember =   $user->subscriptions()->where('status', Subscription::STATUS_ACTIVE)->exists();
        abort_if(! $isMember, 403, 'Access denied. You must be a member to create Exhibition posts.');


        $query = Exhibition::where('user_id', Auth::id())->with('user')->latest();

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

        return Inertia::render('User/Exhibition/Index', [
            'exhibitions' => $exhibitions,
            'filters' => $request->only(['search', 'type', 'status'])
        ]);
    }

    public function create()
    {
        $user = User::find(Auth::id());
        $isMember =   $user->subscriptions()->where('status', Subscription::STATUS_ACTIVE)->exists();
        abort_if(! $isMember, 403, 'Access denied. You must be a member to create Exhibition posts.');

        // Get exhibitions with user relation
        $exhibitions = Exhibition::with('user')->get();

        // Default: not a member
        $member = false;

        // Check if the authenticated user has an active subscription
        if ($user && $user->subscriptions()->where('status', Subscription::STATUS_ACTIVE)->exists()) {
            $member = true;
        }
        $langs = Language::active()->get();
        return Inertia::render('User/Exhibition/Create', [
            'langs' => $langs,
            'member' => $member,
        ]);

    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
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

        ]);

        // Handle main image upload
        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('exhibitions/images');
        }

        // Handle gallery images
        if ($request->hasFile('gallery')) {
            $galleryPaths = [];
            foreach ($request->file('gallery') as $image) {
                $galleryPaths[] = $image->store('exhibitions/gallery');
            }
            $validated['gallery'] = $galleryPaths;
        }

        // Handle document file
        if ($request->hasFile('document_file')) {
            $validated['document_file'] = $request->file('document_file')->store('exhibitions/documents');
        }

        // Set published_at if status is published
        if ($validated['status'] === 'published') {
            $validated['published_at'] = now();
        }
        $validated['slug'] = Str::slug($request->title) . '-' . Str::random(5);

        $validated['user_id'] = Auth::id();
        $validated['link'] = $request->link;
        Exhibition::create($validated);

        return redirect()->route('user.exhibitions.index')
            ->with('success', 'Exhibition item created successfully.');
    }

    public function show(Exhibition $exhibition)
    {

        $user = User::find(Auth::id());
        $isMember =   $user->subscriptions()->where('status', Subscription::STATUS_ACTIVE)->exists();
        abort_if(! $isMember, 403, 'Access denied. You must be a member to create Exhibition posts.');

        $exhibition->increment('views');
        $exhibition->load('user');

        return Inertia::render('User/Exhibition/Show', [
            'exhibition' => $exhibition
        ]);
    }

    public function edit(Exhibition $exhibition)
    {
        $user = User::find(Auth::id());
        $isMember =   $user->subscriptions()->where('status', Subscription::STATUS_ACTIVE)->exists();
        abort_if(! $isMember, 403, 'Access denied. You must be a member to create Exhibition posts.');


        // Get exhibitions with user relation
        $exhibitions = Exhibition::with('user')->get();

        // Default: not a member
        $member = false;

        // Check if the authenticated user has an active subscription
        if ($user && $user->subscriptions()->where('status', Subscription::STATUS_ACTIVE)->exists()) {
            $member = true;
        }

        $langs = Language::active()->get();
        return Inertia::render('User/Exhibition/Edit', [
            'exhibition' => $exhibition,
            'langs' => $langs,
            'member' => $member,
        ]);
    }

    public function update(Request $request, Exhibition $exhibition)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'gallery' => 'nullable|array',
            'price' => 'nullable|numeric|min:0',
            'is_available' => 'boolean',
            'is_featured' => 'boolean',
            'dimensions' => 'nullable|string|max:100',
            'material' => 'nullable|string|max:255',
            'status' => 'required|string|in:draft,published,sold', // Add this line
            'currency' => 'nullable|string|max:3', // Also add currency if needed
            'link' => 'nullable|url', // And link validation
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

        $exhibition->update($validated);

        return redirect()->route('user.exhibitions.index', $exhibition)
            ->with('success', 'Exhibition item updated successfully.');
    }

    public function destroy(Exhibition $exhibition)
    {
        // Delete associated files
        $this->deleteFiles($exhibition);

        $exhibition->delete();

        return redirect()->route('user.exhibitions.index')
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
                Storage::delete($exhibition->image);
            }
            $validated['image'] = $request->file('image')->store('exhibitions/images');
        } else {
            $validated['image'] = $exhibition->image;
        }

        // Handle gallery images
        if ($request->hasFile('gallery')) {
            // Delete old gallery images
            if ($exhibition->gallery) {
                foreach ($exhibition->gallery as $oldImage) {
                    Storage::delete($oldImage);
                }
            }
            // Store new gallery images
            $galleryPaths = [];
            foreach ($request->file('gallery') as $image) {
                $galleryPaths[] = $image->store('exhibitions/gallery');
            }
            $validated['gallery'] = $galleryPaths;
        } else {
            $validated['gallery'] = $exhibition->gallery;
        }

        // Handle document file
        if ($request->hasFile('document_file')) {
            if ($exhibition->document_file) {
                Storage::delete($exhibition->document_file);
            }
            $validated['document_file'] = $request->file('document_file')->store('exhibitions/documents');
        } else {
            $validated['document_file'] = $exhibition->document_file;
        }
    }

    private function deleteFiles($exhibition)
    {
        if ($exhibition->image) {
            Storage::delete($exhibition->image);
        }

        if ($exhibition->gallery) {
            foreach ($exhibition->gallery as $image) {
                Storage::delete($image);
            }
        }

        if ($exhibition->document_file) {
            Storage::delete($exhibition->document_file);
        }
    }
}