<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Language;
use App\Models\Community;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class CommunityController extends Controller
{
    public function index(Request $request)
    {
        $query = Community::with(['user'])
            ->published()
            ->latest();

        if ($request->has('search')) {
            $query->where('title', 'like', '%' . $request->search . '%')
                ->orWhere('content', 'like', '%' . $request->search . '%');
        }

        $posts = $query->paginate(10);

        return Inertia::render('Community/Index', [
            'posts' => $posts,
            'filters' => $request->only(['search'])
        ]);
    }

    public function create()
    {
        $langs = Language::active()->get();
        return Inertia::render('Community/Create', ['langs' => $langs]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'image' => 'nullable|image',
            'status' => 'required|in:draft,published',
            'mood'     => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
        ]);

        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('community', 'public');
        }

        $validated['user_id'] = Auth::id();
        $validated['slug'] = Str::slug($request->title) . '-' . Str::random(5);

        $post = Community::create($validated);

        return to_route('admin.communities.index')->with('success', 'Post created successfully.');
    }

    public function frontStore(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'image' => 'nullable|image',
            'status' => 'required|in:draft,published',
            'mood'     => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
        ]);

        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('community', 'public');
        }

        $validated['user_id'] = Auth::id();
        $validated['slug'] = Str::slug($request->title) . '-' . Str::random(5);

        $post = Community::create($validated);

        return redirect()->back();
    }

    public function show(Community $post)
    {
        $post->load([
            'user',
            'comments.user',
            'comments.replies.user',
            'comments.replies' => function ($query) {
                $query->orderBy('created_at', 'asc');
            }
        ])->loadCount(['comments', 'likes']);

        return Inertia::render('Community/Show', [
            'post' => $post,
            'comments' => $post->comments()->with(['user', 'replies.user'])->get()
        ]);
    }

    public function edit($id)
    {
        $langs = Language::active()->get();
        $post = Community::findOrFail($id);

        // Check authorization
        $this->authorize('update', $post);

        return Inertia::render('Community/Edit', [
            'post' => $post,
            'langs' => $langs,
        ]);
    }

    public function update(Request $request, $id)
    {

        $post = Community::find($id);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'image' => 'nullable|image',
            'status' => 'required|in:draft,published,archived',
            'remove_image' => 'nullable|boolean',
            'mood'     => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
        ]);

        // Handle image removal
        if ($request->has('remove_image') && $request->remove_image) {
            if ($post->image) {
                Storage::disk('public')->delete($post->image);
                $validated['image'] = null;
            }
        }

        // Handle new image upload
        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($post->image) {
                Storage::disk('public')->delete($post->image);
            }
            $validated['image'] = $request->file('image')->store('community', 'public');
        }

        // Generate new slug if title changed
        if ($post->title !== $request->title) {
            $validated['slug'] = Str::slug($request->title) . '-' . Str::random(5);
        }

        $post->update($validated);

        return redirect()->route('admin.communities.index')
            ->with('success', 'Post updated successfully.');
    }

    public function destroy(Community $community)
    {
        if ($community->image) {
            Storage::disk('public')->delete($community->image);
        }

        $community->delete();

        return redirect()->route('admin.communities.index')
            ->with('success', 'Post deleted successfully.');
    }

    // API endpoints for React components
    public function getPosts(Request $request)
    {
        $query = Community::with(['user'])
            ->published()
            ->latest();

        if ($request->has('search')) {
            $query->where('title', 'like', '%' . $request->search . '%');
        }

        return $query->paginate(10);
    }

    public function toggleLike(Community $post)
    {
        $user = Auth::user();
        $like = $post->likes()->where('user_id', $user->id)->first();

        if ($like) {
            $like->delete();
            $post->decrement('likes_count');
            $liked = false;
        } else {
            $post->likes()->create(['user_id' => $user->id]);
            $post->increment('likes_count');
            $liked = true;
        }

        return response()->json([
            'likes_count' => $post->likes_count,
            'liked' => $liked
        ]);
    }

    public function getReactions($id)
    {
        $community = Community::findOrFail($id);

        $reactionCounts = $community->reactions()
            ->select('type', DB::raw('count(*) as count'))
            ->groupBy('type')
            ->pluck('count', 'type')
            ->toArray();

        $userReaction = auth()->check()
            ? $community->reactions()->where('user_id', auth()->id())->first()
            : null;

        return response()->json([
            'reaction_counts' => $reactionCounts,
            'user_reaction' => $userReaction,
        ]);
    }
}
