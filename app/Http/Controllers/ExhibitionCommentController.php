<?php

namespace App\Http\Controllers;

use App\Models\ExhibitionComment;
use App\Models\Exhibition;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ExhibitionCommentController extends Controller
{
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'exhibition_id' => 'required|exists:exhibitions,id',
            'comment' => 'required|string|max:1000',
           'parent_id' => 'nullable|exists:exhibition_comments,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $comment = ExhibitionComment::create([
                'exhibition_id' => $request->exhibition_id,
                'user_id' => auth()->id(),
                'parent_id' => $request->parent_id,
                'comment' => $request->comment,
                'is_approved' => true
            ]);

            $comment->load('user', 'replies.user');

            return response()->json([
                'success' => true,
                'comment' => $comment,
                'message' => 'Comment added successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to add comment'
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