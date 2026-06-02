<?php

namespace App\Http\Controllers;

use App\Models\Community;
use App\Models\CommunityComment;
use App\Models\CommunityPostReaction;
use App\Models\CommunityCommentReaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CommunityReactionController extends Controller
{
   public function togglePostReaction(Request $request)
    {
        if (!auth()->check()) {
            return response()->json([
                'success' => false,
                'message' => 'Please login first.'
            ], 401);
        }

        $request->validate([
            'community_id' => 'required|exists:communities,id',
            'type' => 'required|in:like,love,dislike',
        ]);

        $community = Community::findOrFail($request->community_id);

        $existingReaction = CommunityPostReaction::where([
            'community_id' => $request->community_id,
            'user_id' => auth()->id(),
        ])->first();

        DB::transaction(function () use ($existingReaction, $request) {
            if ($existingReaction) {
                if ($existingReaction->type === $request->type) {
                    $existingReaction->delete();
                } else {
                    $existingReaction->update([
                        'type' => $request->type
                    ]);
                }
            } else {
                CommunityPostReaction::create([
                    'community_id' => $request->community_id,
                    'user_id' => auth()->id(),
                    'type' => $request->type,
                ]);
            }
        });

        $reactionCounts = $community->reactions()
            ->select('type', DB::raw('count(*) as count'))
            ->groupBy('type')
            ->pluck('count', 'type')
            ->toArray();

        $finalCounts = [
            'like' => $reactionCounts['like'] ?? 0,
            'love' => $reactionCounts['love'] ?? 0,
            'dislike' => $reactionCounts['dislike'] ?? 0,
        ];

        $userReaction = $community->reactions()
            ->where('user_id', auth()->id())
            ->first();

        return response()->json([
            'success' => true,
            'message' => 'Reaction updated successfully!',
            'reaction_counts' => $finalCounts,
            'user_reaction' => $userReaction,
        ]);
    }

    public function toggleCommentReaction(Request $request)
    {
        $request->validate([
            'comment_id' => 'required|exists:community_comments,id',
            'type' => 'required|in:like,love,laugh,wow,sad,angry',
        ]);

        $comment = CommunityComment::findOrFail($request->comment_id);

        $existingReaction = CommunityCommentReaction::where([
            'community_comment_id' => $request->comment_id,
            'user_id' => auth()->id(),
        ])->first();

        if ($existingReaction) {
            if ($existingReaction->type === $request->type) {
                $existingReaction->delete();
            } else {
                $existingReaction->update(['type' => $request->type]);
            }
        } else {
            CommunityCommentReaction::create([
                'community_comment_id' => $request->comment_id,
                'user_id' => auth()->id(),
                'type' => $request->type,
            ]);
        }

        $reactionCounts = $comment->reactions()->count();

        return redirect()->back()->with([
            'success' => 'Comment reaction updated successfully!',
            'updated_comment_id' => $comment->id,
            'reactions_count' => $reactionCounts
        ]);
    }
}
