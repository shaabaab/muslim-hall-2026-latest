<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\PostReaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class PostReactionController extends Controller
{
    public function toggle(Request $request)
    {
        // Check authentication
        if (!auth()->check()) {
            return response()->json([
                'success' => false,
                'message' => 'Please login to react'
            ], 401);
        }

        $validator = Validator::make($request->all(), [
            'post_id' => 'required|exists:posts,id',
            'type' => 'required|in:like,love,dislike'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();
            
            $existingReaction = PostReaction::where([
                'post_id' => $request->post_id,
                'user_id' => auth()->id()
            ])->first();

            $action = 'added';
            
            if ($existingReaction) {
                if ($existingReaction->type === $request->type) {
                    // Remove reaction if same type
                    $existingReaction->delete();
                    $action = 'removed';
                } else {
                    // Update reaction type
                    $existingReaction->update(['type' => $request->type]);
                    $action = 'updated';
                }
            } else {
                // Create new reaction
                PostReaction::create([
                    'post_id' => $request->post_id,
                    'user_id' => auth()->id(),
                    'type' => $request->type
                ]);
            }

            // Get updated counts
            $reactionCounts = PostReaction::where('post_id', $request->post_id)
                ->selectRaw('type, count(*) as count')
                ->groupBy('type')
                ->pluck('count', 'type')
                ->toArray();

            // Get user's current reaction
            $userReaction = PostReaction::where([
                'post_id' => $request->post_id,
                'user_id' => auth()->id()
            ])->first();

            DB::commit();

            return response()->json([
                'success' => true,
                'action' => $action,
                'reaction_counts' => array_merge([
                    'like' => 0, 
                    'love' => 0, 
                    'dislike' => 0
                ], $reactionCounts),
                'user_reaction' => $userReaction,
                'message' => 'Reaction ' . $action . ' successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Reaction toggle error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update reaction: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getReactions(Post $post)
    {
        try {
            $reactionCounts = PostReaction::where('post_id', $post->id)
                ->selectRaw('type, count(*) as count')
                ->groupBy('type')
                ->pluck('count', 'type')
                ->toArray();

            $userReaction = auth()->check() ? PostReaction::where([
                'post_id' => $post->id,
                'user_id' => auth()->id()
            ])->first() : null;

            return response()->json([
                'success' => true,
                'reaction_counts' => array_merge([
                    'like' => 0, 
                    'love' => 0, 
                    'dislike' => 0
                ], $reactionCounts),
                'user_reaction' => $userReaction
            ]);

        } catch (\Exception $e) {
            \Log::error('Get reactions error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to get reactions'
            ], 500);
        }
    }
}