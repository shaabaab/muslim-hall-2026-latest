<?php

namespace App\Http\Controllers;

use App\Models\Contest;
use App\Models\Entry;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LotteryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $contest = Contest::where('status', 2)->get();
        return Inertia::render('Lottery/Index', [
            'contests' => $contest,
        ]);
    }
    public function getParticipants(Request $request)
    {
        $contestId = $request->get('contest_id');
        $participants = Entry::with('user')->where('contest_id', $contestId)->get();
        return response()->json([
            'success' => true,
            'data' => $participants
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
