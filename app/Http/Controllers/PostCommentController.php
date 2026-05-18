<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\PostComment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use App\Notifications\PostCommentNotification;

class PostCommentController extends Controller
{
    public function store(Request $request)
    {
        if (!auth()->check()) {
            return response()->json([
                'success' => false,
                'message' => 'Please login to comment'
            ], 401);
        }

        $validator = Validator::make($request->all(), [
            'post_id' => 'required|exists:posts,id',
            'comment' => 'required|string|max:1000',
            'parent_id' => 'nullable|exists:post_comments,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $post = Post::with('author')->findOrFail($request->post_id);

            $commentData = [
                'post_id' => $request->post_id,
                'user_id' => auth()->id(),
                'comment' => $request->comment,
                'is_approved' => true
            ];

            if ($request->filled('parent_id')) {
                $parentComment = PostComment::find($request->parent_id);

                if ($parentComment && $parentComment->post_id == $request->post_id) {
                    $commentData['parent_id'] = $request->parent_id;
                }
            }

            $comment = PostComment::create($commentData);
            $comment->load(['user', 'replies.user']);

            if ($post->author && $post->author->id !== Auth::id()) {
                $post->author->notify(
                    new PostCommentNotification($comment, $post, Auth::user())
                );
            }

            return response()->json([
                'success' => true,
                'comment' => $comment,
                'message' => 'Comment added successfully'
            ], 201);
        } catch (\Exception $e) {
            \Log::error('Comment creation error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to add comment: ' . $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, PostComment $comment)
    {
        if (!auth()->check()) {
            return response()->json([
                'success' => false,
                'message' => 'Please login to update comment'
            ], 401);
        }

        if (
            auth()->id() !== $comment->user_id &&
            !auth()->user()->hasAnyRole(['admin', 'Super Admin'])
        ) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to update this comment'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'comment' => 'required|string|max:1000'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $comment->update([
                'comment' => $request->comment
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Comment updated successfully',
                'comment' => $comment->fresh(['user', 'replies.user'])
            ]);
        } catch (\Exception $e) {
            \Log::error('Comment update error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to update comment'
            ], 500);
        }
    }

    public function destroy(PostComment $comment)
    {
        if (!auth()->check()) {
            return response()->json([
                'success' => false,
                'message' => 'Please login to delete comment'
            ], 401);
        }

        if (
            auth()->id() !== $comment->user_id &&
            !auth()->user()->hasAnyRole(['admin', 'Super Admin'])
        ) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to delete this comment'
            ], 403);
        }

        try {
            if ($comment->replies()->count() > 0) {
                $comment->replies()->delete();
            }

            $comment->delete();

            return response()->json([
                'success' => true,
                'message' => 'Comment deleted successfully'
            ]);
        } catch (\Exception $e) {
            \Log::error('Comment deletion error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete comment'
            ], 500);
        }
    }
}