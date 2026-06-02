<?php

namespace App\Http\Controllers;

use App\Models\Exhibition;
use App\Models\ExhibitionComment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class ExhibitionCommentController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'exhibition_id' => 'required|exists:exhibitions,id',
            'comment' => 'required|string|max:2000',
        ]);

        try {
            $comment = ExhibitionComment::create([
                'exhibition_id' => $request->exhibition_id,
                'user_id' => Auth::id(),
                'parent_id' => null,
                'comment' => $request->comment,
            ]);

            $comment->load([
                'user',
                'replies.user',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Comment added successfully.',
                'comment' => $comment,
            ]);
        } catch (\Throwable $e) {
            Log::error('Exhibition comment store error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to add comment.',
            ], 500);
        }
    }

    public function reply(Request $request)
    {
        $request->validate([
            'exhibition_id' => 'required|exists:exhibitions,id',
            'parent_id' => 'required|exists:exhibition_comments,id',
            'comment' => 'required|string|max:2000',
        ]);

        try {
            $parentComment = ExhibitionComment::where('id', $request->parent_id)
                ->where('exhibition_id', $request->exhibition_id)
                ->whereNull('parent_id')
                ->first();

            if (!$parentComment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Parent comment not found.',
                ], 404);
            }

            $reply = ExhibitionComment::create([
                'exhibition_id' => $request->exhibition_id,
                'user_id' => Auth::id(),
                'parent_id' => $parentComment->id,
                'comment' => $request->comment,
            ]);

            $reply->load('user');

            return response()->json([
                'success' => true,
                'message' => 'Reply added successfully.',
                'reply' => $reply,
            ]);
        } catch (\Throwable $e) {
            Log::error('Exhibition reply store error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to add reply.',
            ], 500);
        }
    }

    public function update(Request $request, ExhibitionComment $comment)
    {
        $this->authorize('update', $comment);

        $validator = Validator::make($request->all(), [
            'comment' => 'required|string|max:1000'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $comment->update(['comment' => $request->comment]);

            return response()->json([
                'success' => true,
                'message' => 'Comment updated successfully',
                'updated_comment' => $request->comment
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update comment'
            ], 500);
        }
    }

    public function destroy(ExhibitionComment $comment)
    {
        $this->authorize('delete', $comment);

        try {
            $comment->delete();

            return response()->json([
                'success' => true,
                'message' => 'Comment deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete comment'
            ], 500);
        }
    }
}