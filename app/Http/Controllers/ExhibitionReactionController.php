<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Exhibition;
use Illuminate\Http\Request;
use App\Models\ExhibitionReaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class ExhibitionReactionController extends Controller
{
    // In IslamicReactionController - Add proper validation and error handling
public function toggle(Request $request)
{
    $validator = Validator::make($request->all(), [
        'exhibition_id' => 'required|exists:exhibitions,id',
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
        
        $existingReaction = ExhibitionReaction::where([
            'exhibition_id' => $request->exhibition_id,
            'user_id' => auth()->id()
        ])->first();

        if ($existingReaction) {
            if ($existingReaction->type === $request->type) {
                $existingReaction->delete();
                $action = 'removed';
            } else {
                $existingReaction->update(['type' => $request->type]);
                $action = 'updated';
            }
        } else {
            ExhibitionReaction::create([
                'exhibition_id' => $request->exhibition_id,
                'user_id' => auth()->id(),
                'type' => $request->type
            ]);
            $action = 'added';
        }

        // Get updated counts
        $reactionCounts = ExhibitionReaction::where('exhibition_id', $request->exhibition_id)
            ->selectRaw('type, count(*) as count')
            ->groupBy('type')
            ->pluck('count', 'type')
            ->toArray();

        $userReaction = ExhibitionReaction::where([
            'exhibition_id' => $request->exhibition_id,
            'user_id' => auth()->id()
        ])->first();

        DB::commit();

        return response()->json([
            'success' => true,
            'action' => $action,
            'reaction_counts' => array_merge(['like' => 0, 'love' => 0, 'dislike' => 0], $reactionCounts),
            'user_reaction' => $userReaction,
            'message' => 'Reaction ' . $action . ' successfully'
        ]);

    } catch (\Exception $e) {
        DB::rollBack();
        \Log::error('Reaction toggle error: ' . $e->getMessage());
        
        return response()->json([
            'success' => false,
            'message' => 'Failed to update reaction'
        ], 500);
    }
}

    public function getReactions($exhibitionId)
    {
        $reactionCounts = ExhibitionReaction::where('exhibition_id', $exhibitionId)
            ->selectRaw('type, count(*) as count')
            ->groupBy('type')
            ->pluck('count', 'type')
            ->toArray();

        $userReaction = auth()->check() ? ExhibitionReaction::where([
            'exhibition_id' => $exhibitionId,
            'user_id' => auth()->id()
        ])->first() : null;

        return response()->json([
            'reaction_counts' => $reactionCounts,
            'user_reaction' => $userReaction
        ]);
    }
}