<?php

namespace App\Http\Controllers\user;

use Inertia\Inertia;
use App\Models\User;
use App\Models\Language;
use App\Models\Exhibition;
use Illuminate\Support\Str;
use App\Models\Subscription;
use Illuminate\Http\Request;
use App\Models\ExhibitionBoard;
use App\Services\ServiceClass;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use App\Models\ExhibitionBoardMember;

class ExhibitionController extends Controller
{
    private function ensureMember()
    {
        $user = Auth::user();

        $isMember = $user && $user->subscriptions()
            ->where('status', Subscription::STATUS_ACTIVE)
            ->exists();

        return $user;
    }

    private function cleanHtml($html)
    {
        return strip_tags($html, '<p><br><strong><b><em><i><u><s><ul><ol><li><a><h1><h2><h3><h4><h5><h6><span><blockquote>');
    }

    private function appendFileUrls($exhibition)
    {
        if (!$exhibition) {
            return $exhibition;
        }

        $exhibition->image_url = ServiceClass::getFileUrl($exhibition->image);
        $exhibition->sponsor_image_url = ServiceClass::getFileUrl($exhibition->sponsor_image);
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

    public function index(Request $request)
    {
        $user = $this->ensureMember();

        $query = Exhibition::where('user_id', $user->id)
            ->with(['user', 'board'])
            ->latest();

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'like', '%' . $request->search . '%')
                    ->orWhere('description', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->filled('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('approval_status') && $request->approval_status !== 'all') {
            $query->where('approval_status', $request->approval_status);
        }

        if ($request->filled('board_id') && $request->board_id !== 'all') {
            $query->where('exhibition_board_id', $request->board_id);
        }

        $exhibitions = $query->paginate(12)->withQueryString();

        $exhibitions->getCollection()->transform(function ($exhibition) {
            return $this->appendFileUrls($exhibition);
        });

        return Inertia::render('User/Exhibition/Index', [
            'exhibitions' => $exhibitions,
            'filters' => $request->only(['search', 'type', 'status', 'approval_status', 'board_id']),
        ]);
    }

    public function create()
    {
        $user = $this->ensureMember();

        $ownBoards = ExhibitionBoard::where('user_id', $user->id)
            ->approved()
            ->active()
            ->get();

        $joinedBoards = ExhibitionBoard::whereHas('memberRequests', function ($query) use ($user) {
                $query->where('user_id', $user->id)
                    ->where('status', ExhibitionBoardMember::STATUS_APPROVED);
            })
            ->approved()
            ->active()
            ->get();

        $boards = $ownBoards->merge($joinedBoards)->unique('id')->values();

        $langs = Language::active()->get();

        return Inertia::render('User/Exhibition/Create', [
            'langs' => $langs,
            'boards' => $boards,
            'member' => true,
        ]);
    }

    public function store(Request $request)
    {
        $user = $this->ensureMember();

        $validated = $request->validate([
            'exhibition_board_id' => 'required|exists:exhibition_boards,id',
            'title' => 'required|string|max:5000',
            'description' => 'required|string',
            'type' => 'required|in:product,document,art,photography,craft',
            'image' => 'required|image',
            'sponsor_image' => 'nullable|image',
            'gallery' => 'nullable|array',
            'gallery.*' => 'image',
            'document_file' => 'nullable|file',
            'price' => 'nullable|numeric|min:0',
            'currency' => 'nullable|string|max:100',
            'is_available' => 'nullable|boolean',
            'is_featured' => 'nullable|boolean',
            'dimensions' => 'nullable|string|max:100',
            'material' => 'nullable|string|max:255',
            'status' => 'nullable|in:draft,published,sold,archived',
            'lang_id' => 'nullable|exists:languages,id',
            'link' => 'nullable|string|max:1000',
        ]);

        $board = ExhibitionBoard::where('id', $validated['exhibition_board_id'])
            ->approved()
            ->active()
            ->firstOrFail();

        $isBoardOwner = $board->user_id === $user->id;

        $isApprovedMember = ExhibitionBoardMember::where('exhibition_board_id', $board->id)
            ->where('user_id', $user->id)
            ->where('status', ExhibitionBoardMember::STATUS_APPROVED)
            ->exists();

        $validated['title'] = $this->cleanHtml($validated['title']);
        $validated['description'] = $this->cleanHtml($validated['description']);

        if ($request->hasFile('image')) {
            $imagePath = ServiceClass::uploadFile($request->file('image'), 'exhibitions/images');

            if (!$imagePath) {
                return back()->with('error', 'Image upload failed.')->withInput();
            }

            $validated['image'] = $imagePath;
        }

        if ($request->hasFile('sponsor_image')) {
            $sponsorImagePath = ServiceClass::uploadFile($request->file('sponsor_image'), 'exhibitions/sponsors');

            if (!$sponsorImagePath) {
                return back()->with('error', 'Sponsor image upload failed.')->withInput();
            }

            $validated['sponsor_image'] = $sponsorImagePath;
        }

        if ($request->hasFile('gallery')) {
            $galleryPaths = [];

            foreach ($request->file('gallery') as $image) {
                $galleryPath = ServiceClass::uploadFile($image, 'exhibitions/gallery');

                if (!$galleryPath) {
                    foreach ($galleryPaths as $oldUploadedGalleryPath) {
                        ServiceClass::deleteFile($oldUploadedGalleryPath);
                    }

                    if (!empty($validated['image'])) {
                        ServiceClass::deleteFile($validated['image']);
                    }

                    if (!empty($validated['sponsor_image'])) {
                        ServiceClass::deleteFile($validated['sponsor_image']);
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

                if (!empty($validated['sponsor_image'])) {
                    ServiceClass::deleteFile($validated['sponsor_image']);
                }

                if (!empty($validated['gallery']) && is_array($validated['gallery'])) {
                    foreach ($validated['gallery'] as $galleryImage) {
                        ServiceClass::deleteFile($galleryImage);
                    }
                }

                return back()->with('error', 'Document upload failed.')->withInput();
            }

            $validated['document_file'] = $documentPath;
        }

        $validated['slug'] = Str::slug(strip_tags($request->title)) . '-' . Str::random(5);
        $validated['user_id'] = $user->id;
        $validated['status'] = $request->status ?? Exhibition::STATUS_DRAFT;
        $validated['approval_status'] = Exhibition::APPROVAL_PENDING;
        $validated['is_available'] = $request->boolean('is_available', true);
        $validated['is_featured'] = $request->boolean('is_featured', false);
        $validated['currency'] = $request->currency ?? 'USD';

        Exhibition::create($validated);

        return redirect()->route('user.exhibitions.index')
            ->with('success', 'Exhibition item created successfully. Waiting for admin approval.');
    }

    public function show(Exhibition $exhibition)
    {
        $user = $this->ensureMember();

        $exhibition->load(['user', 'board']);

        $this->appendFileUrls($exhibition);

        return Inertia::render('User/Exhibition/Show', [
            'exhibition' => $exhibition,
        ]);
    }

    public function edit(Exhibition $exhibition)
    {
        $user = $this->ensureMember();

        $ownBoards = ExhibitionBoard::where('user_id', $user->id)
            ->approved()
            ->active()
            ->get();

        $joinedBoards = ExhibitionBoard::whereHas('memberRequests', function ($query) use ($user) {
                $query->where('user_id', $user->id)
                    ->where('status', ExhibitionBoardMember::STATUS_APPROVED);
            })
            ->approved()
            ->active()
            ->get();

        $boards = $ownBoards->merge($joinedBoards)->unique('id')->values();

        $langs = Language::active()->get();

        $this->appendFileUrls($exhibition);

        return Inertia::render('User/Exhibition/Edit', [
            'exhibition' => $exhibition,
            'langs' => $langs,
            'boards' => $boards,
            'member' => true,
        ]);
    }

    public function update(Request $request, Exhibition $exhibition)
    {
        $user = $this->ensureMember();

        $validated = $request->validate([
            'exhibition_board_id' => 'required|exists:exhibition_boards,id',
            'title' => 'required|string|max:5000',
            'description' => 'nullable|string',
            'type' => 'required|in:product,document,art,photography,craft',
            'image' => 'nullable|image',
            'sponsor_image' => 'nullable|image',
            'gallery' => 'nullable|array',
            'gallery.*' => 'image',
            'document_file' => 'nullable|file',
            'price' => 'nullable|numeric|min:0',
            'currency' => 'nullable|string|max:100',
            'is_available' => 'nullable|boolean',
            'is_featured' => 'nullable|boolean',
            'dimensions' => 'nullable|string|max:100',
            'material' => 'nullable|string|max:255',
            'status' => 'required|string|in:draft,published,sold,archived',
            'lang_id' => 'nullable|exists:languages,id',
            'link' => 'nullable|string|max:1000',
        ]);

        $board = ExhibitionBoard::where('id', $validated['exhibition_board_id'])
            ->approved()
            ->active()
            ->firstOrFail();

        $isBoardOwner = $board->user_id === $user->id;

        $isApprovedMember = ExhibitionBoardMember::where('exhibition_board_id', $board->id)
            ->where('user_id', $user->id)
            ->where('status', ExhibitionBoardMember::STATUS_APPROVED)
            ->exists();

        $validated['title'] = $this->cleanHtml($validated['title']);
        $validated['description'] = $this->cleanHtml($validated['description'] ?? '');

        if ($request->hasFile('image')) {
            $newImagePath = ServiceClass::updateFile(
                $request->file('image'),
                'exhibitions/images',
                $exhibition->image
            );

            if (!$newImagePath) {
                return back()->with('error', 'Image upload failed.')->withInput();
            }

            $validated['image'] = $newImagePath;
        }

        if ($request->hasFile('sponsor_image')) {
            $newSponsorImagePath = ServiceClass::updateFile(
                $request->file('sponsor_image'),
                'exhibitions/sponsors',
                $exhibition->sponsor_image
            );

            if (!$newSponsorImagePath) {
                return back()->with('error', 'Sponsor image upload failed.')->withInput();
            }

            $validated['sponsor_image'] = $newSponsorImagePath;
        }

        if ($request->hasFile('gallery')) {
            if ($exhibition->gallery && is_array($exhibition->gallery)) {
                foreach ($exhibition->gallery as $oldImage) {
                    ServiceClass::deleteFile($oldImage);
                }
            }

            $galleryPaths = [];

            foreach ($request->file('gallery') as $image) {
                $galleryPath = ServiceClass::uploadFile($image, 'exhibitions/gallery');

                if (!$galleryPath) {
                    foreach ($galleryPaths as $oldUploadedGalleryPath) {
                        ServiceClass::deleteFile($oldUploadedGalleryPath);
                    }

                    return back()->with('error', 'Gallery image upload failed.')->withInput();
                }

                $galleryPaths[] = $galleryPath;
            }

            $validated['gallery'] = $galleryPaths;
        }

        if ($request->hasFile('document_file')) {
            $newDocumentPath = ServiceClass::updateFile(
                $request->file('document_file'),
                'exhibitions/documents',
                $exhibition->document_file
            );

            if (!$newDocumentPath) {
                return back()->with('error', 'Document upload failed.')->withInput();
            }

            $validated['document_file'] = $newDocumentPath;
        }

        $validated['approval_status'] = Exhibition::APPROVAL_PENDING;
        $validated['approved_at'] = null;
        $validated['approved_by'] = null;
        $validated['admin_note'] = null;
        $validated['is_available'] = $request->boolean('is_available', true);
        $validated['is_featured'] = $request->boolean('is_featured', false);

        $exhibition->update($validated);

        return redirect()->route('user.exhibitions.index')
            ->with('success', 'Exhibition item updated successfully. Waiting for admin approval again.');
    }

    public function destroy(Exhibition $exhibition)
    {
        $user = $this->ensureMember();

        $this->deleteFiles($exhibition);

        $exhibition->delete();

        return redirect()->route('user.exhibitions.index')
            ->with('success', 'Exhibition item deleted successfully.');
    }

    public function toggleFeatured(Exhibition $exhibition)
    {
        $user = $this->ensureMember();

        $exhibition->update([
            'is_featured' => !$exhibition->is_featured,
        ]);

        return back()->with('success', 'Featured status updated.');
    }

    public function markAsSold(Exhibition $exhibition)
    {
        $user = $this->ensureMember();

        $exhibition->markAsSold();

        return back()->with('success', 'Item marked as sold.');
    }

    private function deleteFiles($exhibition)
    {
        if ($exhibition->image) {
            ServiceClass::deleteFile($exhibition->image);
        }

        if ($exhibition->sponsor_image) {
            ServiceClass::deleteFile($exhibition->sponsor_image);
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
}