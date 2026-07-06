<?php

namespace App\Http\Controllers\user;

use Inertia\Inertia;
use App\Models\Language;
use App\Models\Exhibition;
use Illuminate\Support\Str;
use App\Models\Subscription;
use Illuminate\Http\Request;
use App\Models\ExhibitionBoard;
use App\Services\ServiceClass;
use App\Support\UploadRules;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use App\Models\ExhibitionBoardMember;

class ExhibitionController extends Controller
{
    private function ensureMember()
    {
        $user = Auth::user();

        if (!$user) {
            abort(403, 'Login required.');
        }

        return $user;
    }

    private function cleanHtml($html)
    {
        return strip_tags($html ?? '', '<p><br><strong><b><em><i><u><s><ul><ol><li><a><h1><h2><h3><h4><h5><h6><span><blockquote>');
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

        if ($exhibition->relationLoaded('videos')) {
            $exhibition->videos->transform(function ($item) {
                $item->url = ServiceClass::getFileUrl($item->video ?? $item->path ?? $item->file_path ?? null);
                return $item;
            });
        }

        if ($exhibition->relationLoaded('audios')) {
            $exhibition->audios->transform(function ($item) {
                $item->url = ServiceClass::getFileUrl($item->audio ?? $item->path ?? $item->file_path ?? null);
                return $item;
            });
        }

        if ($exhibition->relationLoaded('pdfs')) {
            $exhibition->pdfs->transform(function ($item) {
                $item->url = ServiceClass::getFileUrl($item->pdf ?? $item->path ?? $item->file_path ?? null);
                return $item;
            });
        }

        return $exhibition;
    }

    private function boardQueryForCreate($user)
    {
        return ExhibitionBoard::with(['owner'])
            ->approved()
            ->active()
            ->latest()
            ->get()
            ->map(function ($board) use ($user) {
                $memberRequest = ExhibitionBoardMember::where('exhibition_board_id', $board->id)
                    ->where('user_id', $user->id)
                    ->first();

                $board->image_url = ServiceClass::getFileUrl($board->image);
                $board->is_owner = (int) $board->user_id === (int) $user->id;
                $board->member_request_status = $memberRequest?->status;
                $board->owner_status = $memberRequest?->owner_status;
                $board->admin_status = $memberRequest?->admin_status;
                $board->can_post_now = $board->is_owner || ($memberRequest && $memberRequest->status === ExhibitionBoardMember::STATUS_APPROVED);
                $board->permission_text = $board->is_owner
                    ? 'My board: only admin approval needed for the exhibition.'
                    : ($board->can_post_now
                        ? 'Joined board: admin exhibition approval needed.'
                        : 'Other member board: board owner approval + admin board access approval + exhibition admin approval needed.');

                return $board;
            });
    }

    public function index(Request $request)
    {
        $user = $this->ensureMember();

        $query = Exhibition::where('user_id', $user->id)
            ->with(['user', 'board', 'videos', 'audios', 'pdfs'])
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
        $exhibitions->getCollection()->transform(fn ($exhibition) => $this->appendFileUrls($exhibition));

        return Inertia::render('User/Exhibition/Index', [
            'exhibitions' => $exhibitions,
            'filters' => $request->only(['search', 'type', 'status', 'approval_status', 'board_id']),
        ]);
    }

    public function create()
    {
        $user = $this->ensureMember();

        return Inertia::render('User/Exhibition/Create', [
            'langs' => Language::active()->get(),
            'boards' => $this->boardQueryForCreate($user),
            'member' => true,
        ]);
    }

    public function store(Request $request)
    {
        $user = $this->ensureMember();

        $validated = $request->validate([
            'board_mode' => 'required|in:existing,new',
            'exhibition_board_id' => 'required_if:board_mode,existing|nullable|exists:exhibition_boards,id',
            'new_board_title' => 'required_if:board_mode,new|nullable|string|max:255',
            'new_board_description' => 'nullable|string|max:10000',
            'new_board_image' => UploadRules::image(),
            'board_request_message' => 'nullable|string|max:1000',
            'title' => 'required|string|max:5000',
            'description' => 'required|string',
            'type' => 'required|in:product,document,art,photography,craft',
            'image' => UploadRules::image(true),
            'sponsor_image' => UploadRules::image(),
            'gallery' => 'nullable|array',
            'gallery.*' => UploadRules::image(),
            'document_file' => UploadRules::document(),
            'videos' => 'nullable|array',
            'videos.*' => UploadRules::video(),
            'audios' => 'nullable|array',
            'audios.*' => UploadRules::audio(),
            'pdfs' => 'nullable|array',
            'pdfs.*' => UploadRules::document(),
            'video_temp_paths' => 'nullable|array',
            'audio_temp_paths' => 'nullable|array',
            'pdf_temp_paths' => 'nullable|array',
            'remove_videos' => 'nullable|array',
            'remove_audios' => 'nullable|array',
            'remove_pdfs' => 'nullable|array',
            'price' => 'nullable|numeric|min:0',
            'currency' => 'nullable|string|max:100',
            'is_available' => 'nullable|boolean',
            'is_featured' => 'nullable|boolean',
            'dimensions' => 'nullable|string|max:100',
            'material' => 'nullable|string|max:255',
            'lang_id' => 'nullable|exists:languages,id',
            'link' => 'nullable|string|max:1000',
        ]);

        $board = $this->resolveBoardForSubmission($request, $validated, $user);

        $validated['title'] = $this->cleanHtml($validated['title']);
        $validated['description'] = $this->cleanHtml($validated['description']);
        $validated['exhibition_board_id'] = $board->id;
        $validated['slug'] = $this->generateUniqueSlug(strip_tags($request->title));
        $validated['user_id'] = $user->id;
        $validated['status'] = Exhibition::STATUS_DRAFT;
        $validated['approval_status'] = Exhibition::APPROVAL_PENDING;
        $validated['approved_at'] = null;
        $validated['approved_by'] = null;
        $validated['admin_note'] = null;
        $validated['is_available'] = $request->boolean('is_available', true);
        $validated['is_featured'] = false;
        $validated['currency'] = $request->currency ?? 'USD';

        $this->uploadMainFiles($request, $validated, null);

        unset($validated['board_mode'], $validated['new_board_title'], $validated['new_board_description'], $validated['new_board_image'], $validated['board_request_message']);

        $exhibition = Exhibition::create($validated);
        $this->syncExtraMedia($request, $exhibition);

        $message = 'Exhibition submitted. Admin approval required.';
        if ((int) $board->user_id !== (int) $user->id) {
            $memberRequest = ExhibitionBoardMember::where('exhibition_board_id', $board->id)->where('user_id', $user->id)->first();
            if (!$memberRequest || $memberRequest->status !== ExhibitionBoardMember::STATUS_APPROVED) {
                $message = 'Exhibition submitted. This board belongs to another member, so board owner approval + admin board access approval + exhibition admin approval are required.';
            }
        }
        if ($request->board_mode === 'new') {
            $message = 'New board and exhibition submitted. Admin must approve the board and the exhibition before it shows publicly.';
        }

        return redirect()->route('user.exhibitions.index')->with('success', $message);
    }

    private function resolveBoardForSubmission(Request $request, array $validated, $user): ExhibitionBoard
    {
        if ($request->board_mode === 'new') {
            $boardData = [
                'user_id' => $user->id,
                'title' => $validated['new_board_title'],
                'slug' => $this->generateUniqueBoardSlug($validated['new_board_title']),
                'description' => $validated['new_board_description'] ?? null,
                'approval_status' => ExhibitionBoard::STATUS_PENDING,
                'is_active' => true,
            ];

            if ($request->hasFile('new_board_image')) {
                $boardImage = ServiceClass::uploadFile($request->file('new_board_image'), 'exhibition-boards');
                if (!$boardImage) {
                    abort(422, 'Board image upload failed.');
                }
                $boardData['image'] = $boardImage;
            }

            return ExhibitionBoard::create($boardData);
        }

        $board = ExhibitionBoard::where('id', $validated['exhibition_board_id'])
            ->approved()
            ->active()
            ->firstOrFail();

        if ((int) $board->user_id !== (int) $user->id) {
            ExhibitionBoardMember::updateOrCreate(
                [
                    'exhibition_board_id' => $board->id,
                    'user_id' => $user->id,
                ],
                [
                    'owner_status' => ExhibitionBoardMember::STATUS_PENDING,
                    'admin_status' => ExhibitionBoardMember::STATUS_PENDING,
                    'status' => ExhibitionBoardMember::STATUS_PENDING,
                    'request_message' => $validated['board_request_message'] ?? 'Requested from exhibition create page.',
                ]
            );
        }

        return $board;
    }

    private function uploadMainFiles(Request $request, array &$validated, ?Exhibition $exhibition = null): void
    {
        if ($request->hasFile('image')) {
            $validated['image'] = $exhibition
                ? ServiceClass::updateFile($request->file('image'), 'exhibitions/images', $exhibition->image)
                : ServiceClass::uploadFile($request->file('image'), 'exhibitions/images');
            if (!$validated['image']) abort(422, 'Image upload failed.');
        }

        if ($request->hasFile('sponsor_image')) {
            $validated['sponsor_image'] = $exhibition
                ? ServiceClass::updateFile($request->file('sponsor_image'), 'exhibitions/sponsors', $exhibition->sponsor_image)
                : ServiceClass::uploadFile($request->file('sponsor_image'), 'exhibitions/sponsors');
            if (!$validated['sponsor_image']) abort(422, 'Sponsor image upload failed.');
        }

        if ($request->hasFile('gallery')) {
            if ($exhibition && is_array($exhibition->gallery)) {
                foreach ($exhibition->gallery as $oldImage) ServiceClass::deleteFile($oldImage);
            }
            $galleryPaths = [];
            foreach ($request->file('gallery') as $image) {
                $path = ServiceClass::uploadFile($image, 'exhibitions/gallery');
                if (!$path) abort(422, 'Gallery image upload failed.');
                $galleryPaths[] = $path;
            }
            $validated['gallery'] = $galleryPaths;
        } elseif ($exhibition) {
            $validated['gallery'] = $exhibition->gallery;
        }

        if ($request->hasFile('document_file')) {
            $validated['document_file'] = $exhibition
                ? ServiceClass::updateFile($request->file('document_file'), 'exhibitions/documents', $exhibition->document_file)
                : ServiceClass::uploadFile($request->file('document_file'), 'exhibitions/documents');
            if (!$validated['document_file']) abort(422, 'Document upload failed.');
        }
    }

    public function show(Exhibition $exhibition)
    {
        $user = $this->ensureMember();
        if ((int) $exhibition->user_id !== (int) $user->id) abort(403);
        $exhibition->load(['user', 'board', 'videos', 'audios', 'pdfs']);
        $this->appendFileUrls($exhibition);
        return Inertia::render('User/Exhibition/Show', ['exhibition' => $exhibition]);
    }

    public function edit(Exhibition $exhibition)
    {
        $user = $this->ensureMember();
        if ((int) $exhibition->user_id !== (int) $user->id) abort(403);
        $exhibition->load(['videos', 'audios', 'pdfs']);
        $this->appendFileUrls($exhibition);

        return Inertia::render('User/Exhibition/Edit', [
            'exhibition' => $exhibition,
            'langs' => Language::active()->get(),
            'boards' => $this->boardQueryForCreate($user),
            'member' => true,
        ]);
    }

    public function update(Request $request, Exhibition $exhibition)
    {
        $user = $this->ensureMember();
        if ((int) $exhibition->user_id !== (int) $user->id) abort(403);

        $validated = $request->validate([
            'exhibition_board_id' => 'required|exists:exhibition_boards,id',
            'board_request_message' => 'nullable|string|max:1000',
            'title' => 'required|string|max:5000',
            'description' => 'nullable|string',
            'type' => 'required|in:product,document,art,photography,craft',
            'image' => UploadRules::image(),
            'sponsor_image' => UploadRules::image(),
            'gallery' => 'nullable|array',
            'gallery.*' => UploadRules::image(),
            'document_file' => UploadRules::document(),
            'videos' => 'nullable|array',
            'videos.*' => UploadRules::video(),
            'audios' => 'nullable|array',
            'audios.*' => UploadRules::audio(),
            'pdfs' => 'nullable|array',
            'pdfs.*' => UploadRules::document(),
            'video_temp_paths' => 'nullable|array',
            'audio_temp_paths' => 'nullable|array',
            'pdf_temp_paths' => 'nullable|array',
            'remove_videos' => 'nullable|array',
            'remove_audios' => 'nullable|array',
            'remove_pdfs' => 'nullable|array',
            'price' => 'nullable|numeric|min:0',
            'currency' => 'nullable|string|max:100',
            'is_available' => 'nullable|boolean',
            'dimensions' => 'nullable|string|max:100',
            'material' => 'nullable|string|max:255',
            'lang_id' => 'nullable|exists:languages,id',
            'link' => 'nullable|string|max:1000',
        ]);

        $board = ExhibitionBoard::where('id', $validated['exhibition_board_id'])->approved()->active()->firstOrFail();
        if ((int) $board->user_id !== (int) $user->id) {
            ExhibitionBoardMember::updateOrCreate(
                ['exhibition_board_id' => $board->id, 'user_id' => $user->id],
                [
                    'owner_status' => ExhibitionBoardMember::STATUS_PENDING,
                    'admin_status' => ExhibitionBoardMember::STATUS_PENDING,
                    'status' => ExhibitionBoardMember::STATUS_PENDING,
                    'request_message' => $validated['board_request_message'] ?? 'Requested from exhibition edit page.',
                ]
            );
        }

        $validated['title'] = $this->cleanHtml($validated['title']);
        $validated['description'] = $this->cleanHtml($validated['description'] ?? '');
        $validated['status'] = Exhibition::STATUS_DRAFT;
        $validated['approval_status'] = Exhibition::APPROVAL_PENDING;
        $validated['approved_at'] = null;
        $validated['approved_by'] = null;
        $validated['admin_note'] = null;
        $validated['is_available'] = $request->boolean('is_available', true);
        $validated['is_featured'] = false;
        $validated['currency'] = $request->currency ?? 'USD';
        unset($validated['board_request_message']);

        $this->uploadMainFiles($request, $validated, $exhibition);
        $exhibition->update($validated);
        $this->syncExtraMedia($request, $exhibition);

        return redirect()->route('user.exhibitions.index')
            ->with('success', 'Exhibition updated. Waiting for required board/admin approval again.');
    }

    public function destroy(Exhibition $exhibition)
    {
        $user = $this->ensureMember();
        if ((int) $exhibition->user_id !== (int) $user->id) abort(403);
        $exhibition->loadMissing(['videos', 'audios', 'pdfs']);
        $this->deleteFiles($exhibition);
        $exhibition->delete();
        return redirect()->route('user.exhibitions.index')->with('success', 'Exhibition deleted successfully.');
    }

    public function toggleFeatured(Exhibition $exhibition)
    {
        $user = $this->ensureMember();
        if ((int) $exhibition->user_id !== (int) $user->id) abort(403);
        $exhibition->update(['is_featured' => !$exhibition->is_featured]);
        return back()->with('success', 'Featured status updated.');
    }

    public function markAsSold(Exhibition $exhibition)
    {
        $user = $this->ensureMember();
        if ((int) $exhibition->user_id !== (int) $user->id) abort(403);
        $exhibition->markAsSold();
        return back()->with('success', 'Item marked as sold.');
    }

    private function syncExtraMedia(Request $request, Exhibition $exhibition): void
    {
        ServiceClass::syncVideos($request, 'videos', $exhibition, 'exhibitions/videos', 'exhibition_videos');
        ServiceClass::syncPdfs($request, 'pdfs', $exhibition, 'exhibitions/documents', 'exhibition_pdfs');
        ServiceClass::syncAudios($request, 'audios', $exhibition, 'exhibitions/audios', 'exhibition_audios');
    }

    private function deleteFiles($exhibition)
    {
        foreach (['image', 'sponsor_image', 'document_file'] as $field) {
            if ($exhibition->{$field}) ServiceClass::deleteFile($exhibition->{$field});
        }
        if (is_array($exhibition->gallery)) {
            foreach ($exhibition->gallery as $image) ServiceClass::deleteFile($image);
        }
        foreach (['videos', 'audios', 'pdfs'] as $relation) {
            if ($exhibition->relationLoaded($relation)) {
                foreach ($exhibition->{$relation} as $item) {
                    ServiceClass::deleteFile($item->video ?? $item->audio ?? $item->pdf ?? $item->path ?? $item->file_path ?? null);
                    $item->delete();
                }
            }
        }
    }

    private function generateUniqueSlug($title, $ignoreId = null)
    {
        $slug = Str::slug(strip_tags($title)) ?: 'exhibition';
        $query = Exhibition::where('slug', 'like', $slug . '%');
        if ($ignoreId) $query->where('id', '!=', $ignoreId);
        $count = $query->count();
        return $count > 0 ? $slug . '-' . ($count + 1) : $slug;
    }

    private function generateUniqueBoardSlug($title, $ignoreId = null)
    {
        $slug = Str::slug(strip_tags($title)) ?: 'board';
        $query = ExhibitionBoard::where('slug', 'like', $slug . '%');
        if ($ignoreId) $query->where('id', '!=', $ignoreId);
        $count = $query->count();
        return $count > 0 ? $slug . '-' . ($count + 1) : $slug;
    }
}
