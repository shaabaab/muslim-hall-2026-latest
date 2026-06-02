<?php

namespace App\Http\Controllers\User;

use Inertia\Inertia;
use Illuminate\Support\Str;
use App\Models\Subscription;
use Illuminate\Http\Request;
use App\Models\ExhibitionBoard;
use App\Services\ServiceClass;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use App\Models\ExhibitionBoardMember;

class ExhibitionBoardController extends Controller
{
    private function ensureMember()
    {
        $user = Auth::user();

        $isMember = $user && $user->subscriptions()
            ->where('status', Subscription::STATUS_ACTIVE)
            ->exists();

        return $user;
    }

    private function canAccessBoard($board, $user)
    {
        if ($board->user_id === $user->id) {
            return true;
        }

        return ExhibitionBoardMember::where('exhibition_board_id', $board->id)
            ->where('user_id', $user->id)
            ->where('status', ExhibitionBoardMember::STATUS_APPROVED)
            ->exists();
    }

    private function appendFileUrls($board)
    {
        if (!$board) {
            return $board;
        }

        $board->image_url = ServiceClass::getFileUrl($board->image);

        return $board;
    }

    public function index(Request $request)
    {
        $user = $this->ensureMember();

        $myBoards = ExhibitionBoard::with(['owner'])
            ->withCount(['exhibitions', 'approvedExhibitions'])
            ->where('user_id', $user->id)
            ->latest()
            ->get()
            ->map(function ($board) {
                return $this->appendFileUrls($board);
            });

        $joinedBoards = ExhibitionBoard::with(['owner'])
            ->whereHas('memberRequests', function ($query) use ($user) {
                $query->where('user_id', $user->id)
                    ->where('status', ExhibitionBoardMember::STATUS_APPROVED);
            })
            ->approved()
            ->active()
            ->latest()
            ->get()
            ->map(function ($board) {
                return $this->appendFileUrls($board);
            });

        $pendingRequests = ExhibitionBoardMember::with(['board.owner', 'user'])
            ->where(function ($query) use ($user) {
                $query->where('user_id', $user->id)
                    ->orWhereHas('board', function ($q) use ($user) {
                        $q->where('user_id', $user->id);
                    });
            })
            ->latest()
            ->get();

        $pendingRequests->transform(function ($requestItem) {
            if ($requestItem->board) {
                $requestItem->board = $this->appendFileUrls($requestItem->board);
            }

            return $requestItem;
        });

        /*
        |--------------------------------------------------------------------------
        | Available Boards For Request
        |--------------------------------------------------------------------------
        | Show other users' approved and active boards only.
        | Hide:
        | - my own boards
        | - boards I already joined
        | - boards I already requested
        |--------------------------------------------------------------------------
        */
        $requestedBoardIds = ExhibitionBoardMember::where('user_id', $user->id)
            ->pluck('exhibition_board_id')
            ->toArray();

        $availableBoards = ExhibitionBoard::with(['owner'])
            ->withCount(['exhibitions', 'approvedExhibitions'])
            ->where('user_id', '!=', $user->id)
            ->whereNotIn('id', $requestedBoardIds)
            ->approved()
            ->active()
            ->latest()
            ->get()
            ->map(function ($board) {
                return $this->appendFileUrls($board);
            });

        return Inertia::render('User/ExhibitionBoards/Index', [
            'myBoards' => $myBoards,
            'joinedBoards' => $joinedBoards,
            'pendingRequests' => $pendingRequests,
            'availableBoards' => $availableBoards,
        ]);
    }

    public function create()
    {
        $this->ensureMember();

        return Inertia::render('User/ExhibitionBoards/Create');
    }

    public function store(Request $request)
    {
        $user = $this->ensureMember();

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'image' => 'nullable|image',
            'is_active' => 'nullable|boolean',
        ]);

        if ($request->hasFile('image')) {
            $imagePath = ServiceClass::uploadFile($request->file('image'), 'exhibition-boards');

            if (!$imagePath) {
                return back()->with('error', 'Board image upload failed.')->withInput();
            }

            $validated['image'] = $imagePath;
        }

        $validated['user_id'] = $user->id;
        $validated['slug'] = $this->generateUniqueSlug($validated['title']);
        $validated['approval_status'] = ExhibitionBoard::STATUS_PENDING;
        $validated['is_active'] = $request->boolean('is_active', true);

        ExhibitionBoard::create($validated);

        return redirect()->route('user.exhibition-boards.index')
            ->with('success', 'Board created successfully. Waiting for admin approval.');
    }

    public function show(ExhibitionBoard $board)
    {
        $user = $this->ensureMember();

        if (!$this->canAccessBoard($board, $user)) {
            abort(403, 'You do not have access to this board.');
        }

        $board->load([
            'owner',
            'exhibitions' => function ($query) {
                $query->with(['user', 'board'])->latest();
            },
            'memberRequests.user',
            'memberRequests.ownerApprovedBy',
            'memberRequests.adminApprovedBy',
        ]);

        $this->appendFileUrls($board);

        if ($board->exhibitions) {
            $board->exhibitions->transform(function ($exhibition) {
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
            });
        }

        return Inertia::render('User/ExhibitionBoards/Show', [
            'board' => $board,
        ]);
    }

    public function edit(ExhibitionBoard $board)
    {
        $user = $this->ensureMember();

        if ($board->user_id !== $user->id) {
            abort(403, 'Only board owner can edit this board.');
        }

        $this->appendFileUrls($board);

        return Inertia::render('User/ExhibitionBoards/Edit', [
            'board' => $board,
        ]);
    }

    public function update(Request $request, ExhibitionBoard $board)
    {
        $user = $this->ensureMember();

        if ($board->user_id !== $user->id) {
            abort(403, 'Only board owner can update this board.');
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'image' => 'nullable|image',
            'is_active' => 'nullable|boolean',
        ]);

        if ($request->hasFile('image')) {
            $newImagePath = ServiceClass::updateFile(
                $request->file('image'),
                'exhibition-boards',
                $board->image
            );

            if (!$newImagePath) {
                return back()->with('error', 'Board image upload failed.')->withInput();
            }

            $validated['image'] = $newImagePath;
        }

        if ($board->title !== $validated['title']) {
            $validated['slug'] = $this->generateUniqueSlug($validated['title'], $board->id);
        }

        $validated['is_active'] = $request->boolean('is_active', true);
        $validated['approval_status'] = ExhibitionBoard::STATUS_PENDING;
        $validated['approved_at'] = null;
        $validated['approved_by'] = null;
        $validated['admin_note'] = null;

        $board->update($validated);

        return redirect()->route('user.exhibition-boards.index')
            ->with('success', 'Board updated successfully. Waiting for admin approval again.');
    }

    public function destroy(ExhibitionBoard $board)
    {
        $user = $this->ensureMember();

        if ($board->user_id !== $user->id) {
            abort(403, 'Only board owner can delete this board.');
        }

        if ($board->image) {
            ServiceClass::deleteFile($board->image);
        }

        $board->delete();

        return redirect()->route('user.exhibition-boards.index')
            ->with('success', 'Board deleted successfully.');
    }

    public function requestAccess(Request $request, ExhibitionBoard $board)
    {
        $user = $this->ensureMember();

        if ($board->user_id === $user->id) {
            return back()->with('error', 'You cannot request access to your own board.');
        }

        if ($board->approval_status !== ExhibitionBoard::STATUS_APPROVED || !$board->is_active) {
            return back()->with('error', 'You can request access only to approved and active boards.');
        }

        $request->validate([
            'request_message' => 'nullable|string|max:1000',
        ]);

        ExhibitionBoardMember::updateOrCreate(
            [
                'exhibition_board_id' => $board->id,
                'user_id' => $user->id,
            ],
            [
                'owner_status' => ExhibitionBoardMember::STATUS_PENDING,
                'admin_status' => ExhibitionBoardMember::STATUS_PENDING,
                'status' => ExhibitionBoardMember::STATUS_PENDING,
                'request_message' => $request->request_message,
            ]
        );

        return back()->with('success', 'Board access request sent. Owner and admin approval required.');
    }

    public function approveMemberRequest(ExhibitionBoardMember $memberRequest)
    {
        $user = $this->ensureMember();

        $memberRequest->load('board');

        if (!$memberRequest->board || $memberRequest->board->user_id !== $user->id) {
            abort(403, 'Only board owner can approve this request.');
        }

        $memberRequest->approveByOwner($user->id);

        return back()->with('success', 'Request approved by board owner. Waiting for admin approval.');
    }

    public function rejectMemberRequest(Request $request, ExhibitionBoardMember $memberRequest)
    {
        $user = $this->ensureMember();

        $memberRequest->load('board');

        if (!$memberRequest->board || $memberRequest->board->user_id !== $user->id) {
            abort(403, 'Only board owner can reject this request.');
        }

        $request->validate([
            'owner_note' => 'nullable|string|max:1000',
        ]);

        $memberRequest->rejectByOwner($user->id, $request->owner_note);

        return back()->with('success', 'Request rejected.');
    }

    private function generateUniqueSlug($title, $ignoreId = null)
    {
        $slug = Str::slug(strip_tags($title));

        if (!$slug) {
            $slug = 'board';
        }

        $query = ExhibitionBoard::where('slug', 'like', $slug . '%');

        if ($ignoreId) {
            $query->where('id', '!=', $ignoreId);
        }

        $count = $query->count();

        return $count > 0 ? $slug . '-' . ($count + 1) : $slug;
    }
}