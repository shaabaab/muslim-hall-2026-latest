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
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
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

    /**
     * Owner segment for this exhibition's S3 keys, e.g. "hasnain-ahmed-12".
     * Slugged because getCloudUrl() concatenates the key onto AWS_URL without
     * URL-encoding it, so a raw name carrying spaces or non-Latin script would
     * produce a dead image link. The id keeps the segment unique when two
     * members share a name, and gives a value at all when slug() strips a
     * non-Latin name to an empty string.
     */
    private function userFolder(): string
    {
        $user = $this->ensureMember();

        return trim(Str::slug($user->name ?? '') . '-' . $user->id, '-');
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
            'title' => 'nullable|string|max:5000',
            // Capped to stay inside the TEXT column: 10000 characters is at most
            // 40000 bytes, against a 65535-byte limit. Matches the admin rules.
            'description' => 'nullable|string|max:10000',
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

        // Everything written to S3 from here on, so it can be removed again if a
        // later step throws. Without this a failed insert left the media in the
        // bucket with no row pointing at it.
        $uploadedKeys = [];

        try {
            $boardImageKey = null;
            if ($request->board_mode === 'new' && $request->hasFile('new_board_image')) {
                $boardImageKey = ServiceClass::uploadFile($request->file('new_board_image'), 'exhibition-boards');
                if (!$boardImageKey) {
                    abort(422, 'Board image upload failed.');
                }
                $uploadedKeys[] = $boardImageKey;
            }

            $validated['title'] = $this->cleanHtml($validated['title']);
            $validated['description'] = $this->cleanHtml($validated['description']);
            $validated['user_id'] = $user->id;
            $validated['status'] = Exhibition::STATUS_DRAFT;
            $validated['approval_status'] = Exhibition::APPROVAL_PENDING;
            $validated['approved_at'] = null;
            $validated['approved_by'] = null;
            $validated['admin_note'] = null;
            $validated['is_available'] = $request->boolean('is_available', true);
            $validated['is_featured'] = false;
            $validated['currency'] = $request->currency ?? 'USD';

            $this->uploadMainFiles($request, $validated, null, $uploadedKeys);

            // The row, the board and the membership request either all land or
            // none of them do. Media syncing stays outside: it moves files that
            // can be gigabytes and must not hold a transaction open.
            [$exhibition, $board] = DB::transaction(function () use ($request, $validated, $user, $boardImageKey) {
                $board = $this->resolveBoardForSubmission($request, $validated, $user, $boardImageKey);

                $validated['exhibition_board_id'] = $board->id;
                $validated['slug'] = $this->generateUniqueSlug(strip_tags($validated['title'] ?? ''));

                unset($validated['board_mode'], $validated['new_board_title'], $validated['new_board_description'], $validated['new_board_image'], $validated['board_request_message']);

                return [Exhibition::create($validated), $board];
            });

            $this->syncExtraMedia($request, $exhibition);
        } catch (\Throwable $e) {
            foreach ($uploadedKeys as $key) {
                ServiceClass::deleteFile($key);
            }

            return $this->submissionFailure($e, 'store', ['user_id' => $user->id]);
        }

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

    private function resolveBoardForSubmission(Request $request, array $validated, $user, ?string $boardImageKey = null): ExhibitionBoard
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

            // Uploaded by the caller before the transaction opened, so the key can
            // be rolled back out of S3 if the insert below fails.
            if ($boardImageKey) {
                $boardData['image'] = $boardImageKey;
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

    /**
     * Write the main media to S3 and put the resulting keys into $validated.
     *
     * Every key written is appended to $uploadedKeys so the caller can delete
     * them again when a later step fails. On an edit the previously stored keys
     * go into $staleKeys instead of being deleted inline: if the update throws,
     * the row still points at files that exist, and the caller only clears them
     * once the write has committed.
     */
    private function uploadMainFiles(Request $request, array &$validated, ?Exhibition $exhibition, array &$uploadedKeys, array &$staleKeys = []): void
    {
        // The edit form initialises these as null, which Inertia sends as "" and
        // ConvertEmptyStringsToNull turns back into null — a value the nullable
        // rules accept, so an edit that leaves the files alone would overwrite the
        // stored paths with NULL. Drop them here: the blocks below re-add each one
        // when a real file is uploaded, and Eloquent ignores keys that are absent.
        unset($validated['image'], $validated['sponsor_image'], $validated['document_file']);

        // Uploads land under the owner's folder, so the public URL reads
        // .../exhibitions/images/hasnain-ahmed-12/<uuid>.jpg. Existing rows keep
        // whatever key they were stored with; only new uploads are namespaced.
        $owner = $this->userFolder();

        if ($request->hasFile('image')) {
            $validated['image'] = ServiceClass::uploadFile($request->file('image'), "exhibitions/images/{$owner}");
            if (!$validated['image']) abort(422, 'Image upload failed.');
            $uploadedKeys[] = $validated['image'];
            if ($exhibition && $exhibition->image) $staleKeys[] = $exhibition->image;
        }

        if ($request->hasFile('sponsor_image')) {
            $validated['sponsor_image'] = ServiceClass::uploadFile($request->file('sponsor_image'), "exhibitions/sponsors/{$owner}");
            if (!$validated['sponsor_image']) abort(422, 'Sponsor image upload failed.');
            $uploadedKeys[] = $validated['sponsor_image'];
            if ($exhibition && $exhibition->sponsor_image) $staleKeys[] = $exhibition->sponsor_image;
        }

        if ($request->hasFile('gallery')) {
            $galleryPaths = [];
            foreach ($request->file('gallery') as $image) {
                $path = ServiceClass::uploadFile($image, "exhibitions/gallery/{$owner}");
                if (!$path) abort(422, 'Gallery image upload failed.');
                $galleryPaths[] = $path;
                $uploadedKeys[] = $path;
            }
            $validated['gallery'] = $galleryPaths;
            if ($exhibition && is_array($exhibition->gallery)) {
                foreach ($exhibition->gallery as $oldImage) $staleKeys[] = $oldImage;
            }
        } elseif ($exhibition) {
            $validated['gallery'] = $exhibition->gallery;
        }

        if ($request->hasFile('document_file')) {
            $validated['document_file'] = ServiceClass::uploadFile($request->file('document_file'), "exhibitions/documents/{$owner}");
            if (!$validated['document_file']) abort(422, 'Document upload failed.');
            $uploadedKeys[] = $validated['document_file'];
            if ($exhibition && $exhibition->document_file) $staleKeys[] = $exhibition->document_file;
        }
    }

    /**
     * Turn a failed submission into something the form can actually show.
     *
     * Validation, authorization and abort() results already carry their own
     * meaning, so they pass straight through. Everything else — a query error, a
     * storage timeout — used to surface as a bare 500, which Inertia renders as
     * the form quietly doing nothing at all. That is what "my exhibition is not
     * submitting" looked like from the user's side. Log the real cause and give
     * them an error on the form instead.
     */
    private function submissionFailure(\Throwable $e, string $action, array $context = [])
    {
        if ($e instanceof ValidationException || $e instanceof AuthorizationException || $e instanceof HttpExceptionInterface) {
            throw $e;
        }

        Log::error("Exhibition {$action} failed", $context + ['exception' => $e]);

        if ($e instanceof ModelNotFoundException) {
            return back()->withInput()->withErrors([
                'exhibition_board_id' => 'That board is no longer available. Pick another board and try again.',
            ]);
        }

        return back()->withInput()->withErrors([
            'submission' => 'Your exhibition could not be saved, so nothing was submitted. Please review the form and try again.',
        ]);
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
            // Capped to stay inside the TEXT column: 10000 characters is at most
            // 40000 bytes, against a 65535-byte limit. Matches the admin rules.
            'description' => 'nullable|string|max:10000',
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
        $requestMessage = $validated['board_request_message'] ?? 'Requested from exhibition edit page.';
        unset($validated['board_request_message']);

        $uploadedKeys = [];
        $staleKeys = [];

        try {
            $this->uploadMainFiles($request, $validated, $exhibition, $uploadedKeys, $staleKeys);

            DB::transaction(function () use ($validated, $exhibition, $board, $user, $requestMessage) {
                if ((int) $board->user_id !== (int) $user->id) {
                    ExhibitionBoardMember::updateOrCreate(
                        ['exhibition_board_id' => $board->id, 'user_id' => $user->id],
                        [
                            'owner_status' => ExhibitionBoardMember::STATUS_PENDING,
                            'admin_status' => ExhibitionBoardMember::STATUS_PENDING,
                            'status' => ExhibitionBoardMember::STATUS_PENDING,
                            'request_message' => $requestMessage,
                        ]
                    );
                }

                $exhibition->update($validated);
            });

            $this->syncExtraMedia($request, $exhibition);
        } catch (\Throwable $e) {
            foreach ($uploadedKeys as $key) {
                ServiceClass::deleteFile($key);
            }

            return $this->submissionFailure($e, 'update', ['user_id' => $user->id, 'exhibition_id' => $exhibition->id]);
        }

        // Only now that the row points at the new keys is it safe to drop what
        // it used to point at.
        foreach ($staleKeys as $key) {
            ServiceClass::deleteFile($key);
        }

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

    /**
     * `slug` is a VARCHAR(255) while the caption it is derived from is a TEXT
     * column validated to 5000 characters, so the base has to be capped or a
     * long caption pushes the insert over the column width — the same class of
     * silent failure this file's other fixes address. 200 leaves room for the
     * "-<n>" uniqueness suffix.
     */
    private function trimSlug(string $slug): string
    {
        return trim(mb_substr($slug, 0, 200), '-');
    }

    private function generateUniqueSlug($title, $ignoreId = null)
    {
        $slug = $this->trimSlug(Str::slug(strip_tags($title))) ?: 'exhibition';
        $query = Exhibition::where('slug', 'like', $slug . '%');
        if ($ignoreId) $query->where('id', '!=', $ignoreId);
        $count = $query->count();
        return $count > 0 ? $slug . '-' . ($count + 1) : $slug;
    }

    private function generateUniqueBoardSlug($title, $ignoreId = null)
    {
        $slug = $this->trimSlug(Str::slug(strip_tags($title))) ?: 'board';
        $query = ExhibitionBoard::where('slug', 'like', $slug . '%');
        if ($ignoreId) $query->where('id', '!=', $ignoreId);
        $count = $query->count();
        return $count > 0 ? $slug . '-' . ($count + 1) : $slug;
    }
}
