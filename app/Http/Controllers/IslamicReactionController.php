<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\IslamicZone;
use Illuminate\Http\Request;
use App\Models\IslamicReaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class IslamicReactionController extends Controller
{
    // In IslamicReactionController - Add proper validation and error handling
public function toggle(Request $request)
{
    $validator = Validator::make($request->all(), [
        'islamic_zone_id' => 'required|exists:islamic_zones,id',
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
        
        $existingReaction = IslamicReaction::where([
            'islamic_zone_id' => $request->islamic_zone_id,
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
            IslamicReaction::create([
                'islamic_zone_id' => $request->islamic_zone_id,
                'user_id' => auth()->id(),
                'type' => $request->type
            ]);
            $action = 'added';
        }

        // Get updated counts
        $reactionCounts = IslamicReaction::where('islamic_zone_id', $request->islamic_zone_id)
            ->selectRaw('type, count(*) as count')
            ->groupBy('type')
            ->pluck('count', 'type')
            ->toArray();

        $userReaction = IslamicReaction::where([
            'islamic_zone_id' => $request->islamic_zone_id,
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

    public function getReactions($islamicZoneId)
    {
        $reactionCounts = IslamicReaction::where('islamic_zone_id', $islamicZoneId)
            ->selectRaw('type, count(*) as count')
            ->groupBy('type')
            ->pluck('count', 'type')
            ->toArray();

        $userReaction = auth()->check() ? IslamicReaction::where([
            'islamic_zone_id' => $islamicZoneId,
            'user_id' => auth()->id()
        ])->first() : null;

        return response()->json([
            'reaction_counts' => $reactionCounts,
            'user_reaction' => $userReaction
        ]);
    }
}