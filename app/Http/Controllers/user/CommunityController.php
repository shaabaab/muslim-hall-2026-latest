<?php


namespace App\Http\Controllers\user;

use App\Http\Controllers\Controller;

use Inertia\Inertia;
use App\Models\Language;
use App\Models\Community;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class CommunityController extends Controller
{
    public function index(Request $request)
    {

        $user = User::find(Auth::id());
        $isMember =   $user->subscriptions()->where('status', Subscription::STATUS_ACTIVE)->exists();
        abort_if(! $isMember, 403, 'Access denied. You must be a member to create Community posts.');


        $query = Community::where('user_id', Auth::id())->with(['user'])
            ->published()
            ->latest();

        // Search functionality
        if ($request->has('search')) {
            $query->where('title', 'like', '%' . $request->search . '%')
                ->orWhere('content', 'like', '%' . $request->search . '%');
        }

        $posts = $query->paginate(10);

        return Inertia::render('User/Community/Index', [
            'posts' => $posts,
            'filters' => $request->only(['search'])
        ]);
    }

    public function create()
    {
        $user = User::find(Auth::id());
        $isMember =   $user->subscriptions()->where('status', Subscription::STATUS_ACTIVE)->exists();

        abort_if(! $isMember, 403, 'Access denied. You must be a member to create Community posts.');



        $langs = Language::active()->get();
        return Inertia::render('User/Community/Create', ['langs' => $langs]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'status' => 'required|in:draft,published',
            'mood'     => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
        ]);

        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('community');
        }

        $validated['user_id'] = Auth::id();

        $validated['slug'] = Str::slug($request->title) . '-' . Str::random(5);

        $post = Community::create($validated);
        // dd($post);
        return redirect()->route('user.communities.index', $post->id)
            ->with('success', 'Post created successfully.');
    }

    public function show(Community $post)
    {

        $user = User::find(Auth::id());
        $isMember =   $user->subscriptions()->where('status', Subscription::STATUS_ACTIVE)->exists();

        abort_if(! $isMember, 403, 'Access denied. You must be a member to create Community posts.');

        // Increment views
        $post->incrementViews();

        $post->load([
            'user',
            'comments.user',
            'comments.replies.user',
            'comments.replies' => function ($query) {
                $query->orderBy('created_at', 'asc');
            }
        ])->loadCount(['comments', 'likes']);

        return Inertia::render('User/Community/Show', [
            'post' => $post,
            'comments' => $post->comments()->with(['user', 'replies.user'])->get()
        ]);
    }

    public function edit($id)
    {
        $user = User::find(Auth::id());
        $isMember =   $user->subscriptions()->where('status', Subscription::STATUS_ACTIVE)->exists();
        abort_if(! $isMember, 403, 'Access denied. You must be a member to create Community posts.');



        $langs = Language::active()->get();
        $post = Community::findOrFail($id);
        return Inertia::render('User/Community/Edit', [
            'post' => $post,
            'langs' => $langs,
        ]);
    }

    public function update(Request $request, $id)
    {
        $post = Community::findOrFail($id);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'status' => 'required|in:draft,published,archived',
            'mood'     => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
        ]);

        if ($request->hasFile('image')) {
            // Delete old image
            if ($post->image) {
                Storage::delete($post->image);
            }
            $validated['image'] = $request->file('image')->store('community');
        }

        $post->update($validated);

        return redirect()->route('user.communities.show', $post->id)
            ->with('success', 'Post updated successfully.');
    }

    public function destroy(Community $post)
    {
        $this->authorize('delete', $post);

        if ($post->image) {
            Storage::delete($post->image);
        }

        $post->delete();

        return redirect()->route('user.communities.index')
            ->with('success', 'Post deleted successfully.');
    }

    // API endpoints for React components
    public function getPosts(Request $request)
    {

        // $user = User::find(Auth::id());
        // $isMember =   $user->subscriptions()->where('status', Subscription::STATUS_ACTIVE)->exists();
        // abort_if(! $isMember, 403, 'Access denied. You must be a member to create Community posts.');


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
}
