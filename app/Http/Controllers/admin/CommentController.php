<?php

namespace App\Http\Controllers\admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Comment;
use App\Models\Post;

class CommentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request , $id = null)
    {
       $comments = Comment::with(['comment_by'])
        ->whereIn('post_id', $id)
        ->orderBy('id', 'desc')
        ->get();

        return $comments->count() <= 0 ? redirect()->back()->with('error', 'No comments found for this post.') : inertia('Post/Comments/Index', compact('comments'));
    }

    

    public function latestComments()
    {
       $comments = Comment::with(['post', 'comment_by'])
        ->orderBy('id', 'desc')
        ->take(5)
        ->get();
        return response()->json($comments);
    }


    // user listing comments
    public function userComments(Request $request)
    {
       $comments = Comment::with(['post', 'comment_by'])
       ->where($request->comment_by ? 'comment_by' : 'post_id', $request->comment_by ? $request->comment_by : $request->post_id)
        ->where('comment_by', auth()->id())
        ->orderBy('id', 'desc')
        ->get();
        return inertia('Post/Comments/UserComments', compact('comments'));
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
        // validation
        $request->validate([
            'post_id' => 'required|exists:posts,id',
            'comment' => 'required|string',
        ]);

        Comment::create([
            'post_id' => $request->post_id,
            'comment' => $request->comment,
            'comment_by' => auth()->id(),
        ]);

        return redirect()->route('admin.comments.index')->with('success', 'Comment added successfully.');


    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {

        $comments =  Post::find($id)->comments()->with('comment_by')->get();
        // $comments = Comment::with(['comment_by'])
        // ->where('post_id', $id)
        // ->orderBy('id', 'desc')
        // ->get();

        // foreach($comments as $comment){
        //     echo $comment->comment_by ? $comment->comment_by->name : 'N/A' . " : " . $comment->comment . "<br>";
        // }

        // return $comments;

        // return $comments->count() <= 0 ? redirect()->back()->with('error', 'No comments found for this post.') : inertia('Post/Comments/Index', compact('comments'));


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
        $comment = Comment::findOrFail($id);
        $comment->delete();

        return redirect()->route('admin.comments.index')->with('success', 'Comment deleted successfully.');
    }
}
