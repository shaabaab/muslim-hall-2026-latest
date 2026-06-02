<?php

namespace App\Http\Controllers;

use App\Models\Community;
use App\Models\CommunityComment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class CommunityCommentController extends Controller
{
    public function store(Request $request)
    {

        Log::info('Comment store request:', $request->all());
        
        $validated = $request->validate([
            'community_id' => 'required|exists:communities,id',
            'comment' => 'nullable|string|max:1000',
            'parent_id' => 'nullable|exists:community_comments,id',
        ]);

        $comment = CommunityComment::create([
            'community_id' => $validated['community_id'],
            'user_id' => auth()->id(),
            'parent_id' => $validated['parent_id'] ?? null,
            'content' => $validated['comment'] ??  $request->content,
        ]);

        if (!$request->parent_id) {
            Community::where('id', $validated['community_id'])->increment('comments_count');
        }

        // Load relationships
        $comment->load(['user', 'replies.user', 'reactions']);

        // Return success response
        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Comment added successfully!',
                'comment' => $comment,
            ]);
        }

        return redirect()->back()->with('success', 'Comment added successfully!');
    }

    public function update(Request $request, CommunityComment $comment)
    {
        // Check authorization
        $this->authorize('update', $comment);

        // Accept both 'comment' and 'content' fields for compatibility
        $validated = $request->validate([
            'comment' => 'sometimes|required|string|max:1000',
            'content' => 'sometimes|required|string|max:1000',
        ]);

        // Use whichever field is provided
        $content = $validated['comment'] ?? $validated['content'] ?? null;

        if (!$content) {
            return response()->json([
                'success' => false,
                'message' => 'Comment content is required',
            ], 422);
        }

        $comment->update([
            'content' => $content,
        ]);

        // Reload the comment with relationships
        $comment->load(['user', 'replies.user', 'reactions']);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Comment updated successfully!',
                'comment' => $comment,
            ]);
        }

        return redirect()->back()->with('success', 'Comment updated successfully!');
    }

    public function destroy(CommunityComment $comment)
    {
        // Check authorization
        $this->authorize('delete', $comment);

        $isParent = is_null($comment->parent_id);
        
        if ($isParent) {
            Community::where('id', $comment->community_id)->decrement('comments_count');
        }

        $comment->delete();

        if (request()->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Comment deleted successfully!',
            ]);
        }

        return redirect()->back()->with('success', 'Comment deleted successfully!');
    }
}