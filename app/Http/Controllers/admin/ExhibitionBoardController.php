<?php

namespace App\Http\Controllers\Admin;

use Inertia\Inertia;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use App\Models\ExhibitionBoard;
use App\Models\ExhibitionBoardMember;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use App\Services\ServiceClass;

class ExhibitionBoardController extends Controller
{
    public function index(Request $request)
    {
        $boards = ExhibitionBoard::with(['owner', 'approvedBy'])
            ->withCount(['exhibitions', 'approvedExhibitions', 'memberRequests'])
            ->when($request->filled('search'), function ($query) use ($request) {
                $query->where(function ($q) use ($request) {
                    $q->where('title', 'like', '%' . $request->search . '%')
                        ->orWhere('description', 'like', '%' . $request->search . '%');
                });
            })
            ->when($request->filled('approval_status') && $request->approval_status !== 'all', function ($query) use ($request) {
                $query->where('approval_status', $request->approval_status);
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        $boards->getCollection()->transform(function ($board) {
            return $this->appendFileUrls($board);
        });
        return Inertia::render('Admin/ExhibitionBoards/Index', [
            'boards' => $boards,
            'filters' => $request->only(['search', 'approval_status']),
        ]);
    }

    public function show(ExhibitionBoard $board)
    {
        $board->load([
            'owner',
            'approvedBy',
            'exhibitions.user',
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

                return $exhibition;
            });
        }

        return Inertia::render('Admin/ExhibitionBoards/Show', [
            'board' => $board,
        ]);
    }
    public function approve(ExhibitionBoard $board)
    {
        $board->approve(Auth::id());

        return back()->with('success', 'Board approved successfully.');
    }

    public function reject(Request $request, ExhibitionBoard $board)
    {
        $request->validate([
            'admin_note' => 'nullable|string|max:1000',
        ]);

        $board->reject(Auth::id(), $request->admin_note);

        return back()->with('success', 'Board rejected successfully.');
    }

    public function approveMemberRequest(ExhibitionBoardMember $memberRequest)
    {
        $memberRequest->approveByAdmin(Auth::id());

        return back()->with('success', 'Board member request approved by admin.');
    }

    public function rejectMemberRequest(Request $request, ExhibitionBoardMember $memberRequest)
    {
        $request->validate([
            'admin_note' => 'nullable|string|max:1000',
        ]);

        $memberRequest->rejectByAdmin(Auth::id(), $request->admin_note);

        return back()->with('success', 'Board member request rejected by admin.');
    }

    public function destroy(ExhibitionBoard $board)
    {
        if ($board->image) {
            ServiceClass::deleteFile($board->image);
        }

        $board->delete();

        return redirect()->route('admin.exhibition-boards.index')
            ->with('success', 'Board deleted successfully.');
    }

    private function appendFileUrls($board)
    {
        if (!$board) {
            return $board;
        }

        $board->image_url = ServiceClass::getFileUrl($board->image);

        return $board;
    }
}