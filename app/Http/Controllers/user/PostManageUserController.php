<?php

namespace App\Http\Controllers\user;

use App\Http\Controllers\Controller;
use App\Http\Requests\PostStoreRequest;
use App\Http\Requests\PostUpdateRequest;
use App\Models\Post;
use App\Models\Category;
use App\Models\Language;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Services\ServiceClass;
use Smalot\PdfParser\Parser;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;
use App\Models\User;
use App\Notifications\NewPostNotification;
use Illuminate\Support\Facades\Notification;
use App\Notifications\PostApprovedNotification;

class PostManageUserController extends Controller
{
    /**
     * Display a listing of user's posts
     */
    public function index(Request $request)
    {
        $posts = Post::with(['category', 'videos', 'pdfs', 'audios'])
            ->where('created_by', auth()->id())
            ->where('permission', '!=', Post::PERMISSION_REJECTED)
            ->when($request->filled('search'), fn($q) => $q->where('title', 'like', '%' . $request->search . '%'))
            ->when($request->filled('status'), function ($q) use ($request) {
                if ($request->status === 'processing') {
                    // Show posts that still have any media in 'processing' state
                    $q->where(function ($sub) {
                        $sub->where('audio', 'processing')
                            ->orWhereHas('videos', fn($v) => $v->where('video', 'processing'))
                            ->orWhereHas('pdfs', fn($p) => $p->where('pdf', 'processing'))
                            ->orWhereHas('audios', fn($a) => $a->where('audio', 'processing'));
                    });
                } else {
                    $q->where('status', $request->status);
                }
            })
            ->when($request->filled('category_id'), fn($q) => $q->where('category_id', $request->category_id))
            ->orderByDesc('id')
            ->paginate($request->get('per_page', 10))
            ->withQueryString();

        $categories = Category::active()->get(['id', 'name']);

        $user = auth()->user();
        $isMember = $user->hasRole(['admin', 'Super Admin']) || $user->subscriptions()->exists();

        return Inertia::render('UserNavSection/Post/Index', [
            'posts' => $posts,
            'filters' => $request->only(['search', 'status', 'category_id']),
            'categories' => $categories,
            'isMember' => $isMember,
        ]);
    }

    public function updateStatus(Post $post, Request $request)
    {
        // Validate the request
        $request->validate([
            'status' => 'required|boolean',
        ]);

        // Update the post status
        $post->update([
            'status' => $request->status,
        ]);

        return back()->with('success', 'Post status updated successfully.');
    }

    /**
     * Show the form for creating a new post
     */
    public function create()
    {
        $user = auth()->user();
        $isMember = $user->hasRole(['admin', 'Super Admin']) || $user->subscriptions()->exists();

        $categories = Category::with('language')->active()->get();

        return Inertia::render('UserNavSection/Post/Create', [
            'categories' => $categories,
            'languages' => Language::active()->get(['id', 'name']),
            'post' => null,
            'isMember' => $isMember,
        ]);
    }

    /**
     * Store a newly created post
     */
    public function store(PostStoreRequest $request)
    {
        $validated = $request->validated();

        try {
            DB::beginTransaction();

            $thumbnailPath = null;
            $sponsorPath = null;


            if ($request->hasFile('thumbnail')) {
                $thumbnailPath = ServiceClass::uploadFile($request->file('thumbnail'), 'posts/thumbnails');
            }

            if ($request->hasFile('sponsor')) {
                $sponsorPath = ServiceClass::uploadFile($request->file('sponsor'), 'posts/sponsors');
            }


            // Upload optional media files
            $pdfPath = null;
            $videoPath = null;
            $audioPath = null;
            $pdfContent = null;

            // ── CHUNKED UPLOAD HANDLING (New) ──
            if ($request->filled('video_temp_path')) {
                $videoPath = 'processing';
            } elseif ($request->hasFile('video')) {
                $videoPath = 'processing';
            } elseif ($request->boolean('is_background') && $request->filled('has_video')) {
                $videoPath = 'processing';
            }

            if ($request->filled('audio_temp_path')) {
                $audioPath = 'processing';
            } elseif ($request->hasFile('audio')) {
                $audioPath = 'processing';
            } elseif ($request->boolean('is_background') && $request->filled('has_audio')) {
                $audioPath = 'processing';
            }

            if ($request->filled('pdf_temp_path')) {
                $pdfPath = 'processing';
            } elseif ($request->hasFile('pdf')) {
                $pdfPath = 'processing';
            } elseif ($request->boolean('is_background') && $request->filled('has_pdf')) {
                $pdfPath = 'processing';
            }

            $content = $validated['content'] ?? null;
            $content = $this->compressBase64Images($content);

            // Create post
            $post = Post::create([
                'title' => $validated['title'],
                'category_id' => $validated['category_id'],
                'lang_id' => $validated['lang_id'] ?? null,
                'status' => $validated['status'],
                'content' => $content,
                'pdf' => null, // Deprecated single field
                'video' => null, // Deprecated single field
                'audio' => $audioPath ?? null,
                'video_url' => $validated['video_url'] ?? null,
                'created_by' => auth()->id(),
                'thumbnail' => $thumbnailPath ?? null,
                'sponsor' => $sponsorPath ?? null,
                'pdf_content' => $pdfContent ?? null,
                'permission' => Post::PERMISSION_PENDING
            ]);

            if ($post) {
                if ($request->hasFile('featured_images')) {
                    ServiceClass::uploadMultipleImages($request, 'featured_images', $post, 'images', 'posts/images');
                }

                // Handle multiple videos
                ServiceClass::syncVideos($request, 'videos', $post, 'posts/videos');

                // Handle multiple pdfs
                ServiceClass::syncPdfs($request, 'pdfs', $post, 'posts/pdfs');

                // Handle multiple audios
                ServiceClass::syncAudios($request, 'audios', $post, 'posts/audios');

                // If backgrounding, also create placeholder rows for any multiple-upload files
                if ($request->boolean('is_background')) {
                    if ($request->filled('video_count')) {
                        for ($i = 0; $i < $request->input('video_count'); $i++) {
                            $post->videos()->create(['video' => 'processing']);
                        }
                    }
                    if ($request->filled('pdf_count')) {
                        for ($i = 0; $i < $request->input('pdf_count'); $i++) {
                            $post->pdfs()->create(['pdf' => 'processing']);
                        }
                    }
                    if ($request->filled('audio_count')) {
                        for ($i = 0; $i < $request->input('audio_count'); $i++) {
                            $post->audios()->create(['audio' => 'processing']);
                        }
                    }
                }
            }


            DB::commit();

            // AUDIO (Single audio is still handled here, can be moved to background if needed)
            if ($request->filled('audio_temp_path')) {
                ServiceClass::dispatchLargeFileJob($request->audio_temp_path, 'posts/audios', 'posts', 'audio', $post->id);
            } elseif ($request->hasFile('audio')) {
                ServiceClass::uploadLargeFile($request->file('audio'), 'posts/audios', 'posts', 'audio', $post->id);
            }

            // Notify Admins
            $admins = User::whereHas('roles', function ($q) {
                $q->where('name', 'admin')->orWhere('name', 'Super Admin');
            })->get();

            Notification::send($admins, new NewPostNotification($post));

            // Determine success message
            $hasLargeFiles = $request->hasFile('video') || $request->hasFile('audio') || $request->hasFile('pdf') ||
                $request->filled('video_temp_path') || $request->filled('audio_temp_path') || $request->filled('pdf_temp_path');
            $successMsg = $hasLargeFiles
                ? 'Post created. Large files (video/audio/pdf) are being uploaded in the background.'
                : 'Post created successfully.';

            if ($request->boolean('is_background') || $request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'postId' => $post->id,
                    'message' => 'Post created and processing in background.'
                ]);
            }

            return to_route('user.posts.index')
                ->with('success', $successMsg);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Post Store Error: ' . $e->getMessage());
            return back()->with('error', 'Error: ' . $e->getMessage())->withInput();
        }
    }

    /**
     * Display the specified post
     */
    public function show(string $id)
    {
        $post = Post::with([
            'category.parent',
            'images',
            'videos',
            'pdfs',
            'audios',
            'comments' => function ($query) {
                $query->with(['user', 'replies.user']);
            },
            'reactions.user',
        ])
            ->where('id', $id)
            ->where('created_by', auth()->id())
            ->firstOrFail();

        // Get reaction counts
        $reactionCounts = [
            'like' => $post->reactions()->where('type', 'like')->count(),
            'love' => $post->reactions()->where('type', 'love')->count(),
            'dislike' => $post->reactions()->where('type', 'dislike')->count(),
        ];

        // Get user's reaction if logged in
        $userReaction = auth()->check()
            ? $post->reactions()->where('user_id', auth()->id())->first()
            : null;

        $userReactionType = $userReaction ? $userReaction->type : 'none';

        $ip = request()->ip();

        $viewerIps = $post->viewer_ips ?? [];

        if (!is_array($viewerIps)) {
            $viewerIps = json_decode($viewerIps, true) ?? [];
        }

        if (!in_array($ip, $viewerIps)) {
            $viewerIps[] = $ip;

            $post->update([
                'viewer_ips' => $viewerIps,
                'viewer_count' => $post->viewer_count + 1,
            ]);
        }

        return Inertia::render('UserNavSection/Post/Show', [
            'post' => $post,
            'reaction_counts' => $reactionCounts,
            'user_reaction' => $userReaction,
            'userReactionType' => $userReactionType,
        ]);
    }

    /**
     * Show the form for editing a post
     */
    public function edit(string $id)
    {
        $post = Post::with([
            'images',
            'videos',
            'pdfs',
            'audios',
            'language',
            'category'
        ])
            ->where('id', $id)
            ->where('created_by', auth()->id())
            ->firstOrFail();
        $categories = Category::with('language')->active()->get();



        return Inertia::render('UserNavSection/Post/Create', [
            'post' => [
                'id' => $post->id,
                'title' => $post->title,
                'content' => $post->content,
                'lang_id' => $post->lang_id,
                'category_id' => $post->category_id,
                'status' => $post->status,
                'statusBox' => $post->statusBox,
                'thumbnail' => $post->thumbnail,
                'sponsor' => $post->sponsor,
                'pdf' => $post->pdf,
                'video' => $post->video,
                'audio' => $post->audio,
                'video_url' => $post->video_url,
                'featured_images' => $post->images->map(fn($img) => [
                    'id' => $img->id,
                    'image' => $img->image,
                    'name' => basename($img->image),
                    'url' => Storage::url($img->image),
                ]),
                'post_videos' => $post->videos->map(fn($v) => [
                    'id' => $v->id,
                    'video' => $v->video,
                    'name' => basename($v->video),
                    'url' => Storage::url($v->video),
                ]),
                'post_pdfs' => $post->pdfs->map(fn($p) => [
                    'id' => $p->id,
                    'pdf' => $p->pdf,
                    'name' => basename($p->pdf),
                    'url' => Storage::url($p->pdf),
                ]),
                'post_audios' => $post->audios->map(fn($a) => [
                    'id' => $a->id,
                    'audio' => $a->audio,
                    'name' => basename($a->audio),
                    'url' => Storage::url($a->audio),
                ]),
                'created_at' => $post->created_at,
                'updated_at' => $post->updated_at,
            ],
            'languages' => Language::active()->get(['id', 'name']),
            'categories' => $categories,
        ]);
    }

    /**
     * Update the specified post
     */
    public function update(PostUpdateRequest $request, string $id)
    {

        $post = Post::where('id', $id)
            ->where('created_by', auth()->id())
            ->firstOrFail();

        $validated = $request->validated();


        try {
            DB::beginTransaction();

            /* ------------------------------
         | Normalize request values
         ------------------------------*/
            $status = (int) ($validated['status'] ?? 0);
            unset($validated['statusBox']);

            /* ------------------------------
         | Existing media
         ------------------------------*/
            $thumbnailPath = $post->thumbnail;
            $sponsorPath   = $post->sponsor;
            $pdfPath       = $post->pdf;
            $videoPath     = $post->video;
            $audioPath     = $post->audio;
            $pdfContent    = $post->pdf_content;
            $videoUrl      = $validated['video_url'] ?? null;

            /* ------------------------------
         | Remove flags
         ------------------------------*/
            foreach (
                [
                    'thumbnail',
                    'sponsor',
                    'pdf',
                    'video',
                    'audio'
                ] as $field
            ) {
                if ($request->boolean("remove_{$field}")) {
                    ServiceClass::deleteFile($post->$field);
                    ${$field . 'Path'} = null;
                    if ($field === 'pdf') $pdfContent = null;
                }
            }

            /* ------------------------------
         | Upload replacements
         ------------------------------*/
            if ($request->hasFile('thumbnail')) {
                ServiceClass::deleteFile($post->thumbnail);
                $thumbnailPath = ServiceClass::uploadFile(
                    $request->file('thumbnail'),
                    'posts/thumbnails'
                );
            }

            if ($request->hasFile('sponsor')) {
                ServiceClass::deleteFile($post->sponsor);
                $sponsorPath = ServiceClass::uploadFile(
                    $request->file('sponsor'),
                    'posts/sponsors'
                );
            }

            if ($request->hasFile('audio')) {
                if ($post->audio && $post->audio !== 'processing') {
                    ServiceClass::deleteFile($post->audio);
                }

                // $audioPath = ServiceClass::uploadLargeFile(
                //     $request->file('audio'),
                //     'posts/audios',
                //     'posts',
                //     'audio',
                //     $post->id
                // );
                ServiceClass::uploadLargeFile(
                    $request->file('audio'),
                    'posts/audios',
                    'posts',
                    'audio',
                    $post->id
                );

                $audioPath = $post->fresh()->audio;
            } elseif ($request->filled('audio_temp_path')) {
                if ($post->audio && $post->audio !== 'processing') {
                    ServiceClass::deleteFile($post->audio);
                }

                $audioPath = 'processing';

                ServiceClass::dispatchLargeFileJob(
                    $request->audio_temp_path,
                    'posts/audios',
                    'posts',
                    'audio',
                    $post->id
                );
            } elseif ($request->boolean('is_background') && $request->filled('has_audio')) {
                $audioPath = 'processing';
            }

            /* ------------------------------
         | Media update (Multiple)
         ------------------------------*/
            ServiceClass::syncVideos($request, 'videos', $post, 'posts/videos');
            ServiceClass::syncPdfs($request, 'pdfs', $post, 'posts/pdfs');
            ServiceClass::syncAudios($request, 'audios', $post, 'posts/audios');

            if (
                $request->hasFile('featured_images') ||
                $request->filled('existing_featured_images') ||
                $request->filled('remove_featured_images')
            ) {
                ServiceClass::syncFeaturedImages(
                    $request,
                    'featured_images',
                    $post,
                    'images',
                    'posts/images'
                );
            }

            /* ------------------------------
         | Content handling
         ------------------------------*/
            $content = $this->processContentForUpdate(
                $validated['content'],
                $post->content
            );

            $this->cleanupOldContentImages(
                $post->content,
                $content
            );

            /* ------------------------------
         | Update post (MODEL stays $post)
         ------------------------------*/
            $post->update([
                'title'       => $validated['title'],
                'category_id' => $validated['category_id'],
                'lang_id'     => $validated['lang_id'],
                'status'      => $status,
                'content'     => $content,
                'pdf'         => null, // Deprecated
                'video'       => null, // Deprecated
                'audio'       => $audioPath,
                'video_url'   => $videoUrl,
                'thumbnail'   => $thumbnailPath,
                'sponsor'     => $sponsorPath,
                'pdf_content' => $pdfContent,
                'updated_by'  => auth()->id(),
            ]);


            DB::commit();

            // Determine success message
            $hasLargeFiles = $request->hasFile('video') || $request->hasFile('audio') || $request->hasFile('pdf') ||
                $request->filled('video_temp_path') || $request->filled('audio_temp_path') || $request->filled('pdf_temp_path');
            $successMsg = $hasLargeFiles
                ? 'Post updated. Large files (video/audio/pdf) are being uploaded in the background.'
                : 'Post updated successfully.';

            return to_route('user.posts.index')
                ->with('success', $successMsg);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Post Update Error: ' . $e->getMessage());

            return back()
                ->with('error', 'Error updating post.')
                ->withInput();
        }
    }

    /**
     * Remove the specified post
     */
    public function destroy(string $id)
    {
        try {
            DB::beginTransaction();

            $post = Post::findOrFail($id);

            // Delete notifications related to this post
            DB::table('notifications')
                ->where(function ($query) use ($post) {
                    $query->where('type', NewPostNotification::class)
                        ->where('data->post_id', $post->id);
                })
                ->orWhere(function ($query) use ($post) {
                    $query->where('type', PostApprovedNotification::class)
                        ->where('data->post_id', $post->id);
                })
                ->orWhere(function ($query) use ($post) {
                    $query->where('type', NewReportNotification::class)
                        ->where('data->reportable_type', Post::class)
                        ->where('data->reportable_id', $post->id);
                })
                ->delete();

            // Delete reports related to this post
            $post->reports()->delete();

            // Delete files
            ServiceClass::deleteFile($post->image);
            ServiceClass::deleteFile($post->thumbnail);
            ServiceClass::deleteFile($post->sponsor);
            ServiceClass::deleteFile($post->pdf);
            ServiceClass::deleteFile($post->video);
            ServiceClass::deleteFile($post->audio);

            $post->delete();

            DB::commit();

            return to_route('user.posts.index')
                ->with('success', 'Post deleted successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('User Post Delete Error: ' . $e->getMessage());

            return back()->with('error', 'Error deleting post: ' . $e->getMessage());
        }
    }



    /**
     * Process content for update (handle both existing URLs and new base64 images)
     */
    private function processContentForUpdate($newContent, $existingContent)
    {
        if (empty($newContent)) {
            return $newContent;
        }

        // Extract existing image URLs from old content
        $existingUrls = [];
        if (!empty($existingContent)) {
            preg_match_all('/src="([^"]*\/storage\/[^"]+)"/', $existingContent, $matches);
            if (!empty($matches[1])) {
                $existingUrls = $matches[1];
            }
        }

        // Extract new base64 images from new content
        $base64Images = [];
        preg_match_all('/src="(data:image\/([^;]+);base64,([^"]+))"/', $newContent, $matches);

        if (!empty($matches[0])) {
            foreach ($matches[0] as $key => $fullMatch) {
                $base64String = $matches[1][$key];
                $imageType = strtolower($matches[2][$key]);
                $base64Data = $matches[3][$key];

                // Store the base64 image and get URL
                $url = $this->storeBase64Image($base64Data, $imageType);
                if ($url) {
                    // Replace base64 with URL in content
                    $newContent = str_replace($base64String, $url, $newContent);
                }
            }
        }

        return $newContent;
    }

    /**
     * Store a single base64 image and return URL
     */
    private function storeBase64Image($base64Data, $imageType)
    {
        try {
            // Decode base64 data
            $imageBinary = base64_decode($base64Data);
            if (!$imageBinary) {
                return null;
            }

            // Validate image
            if (!@imagecreatefromstring($imageBinary)) {
                return null;
            }

            // Create unique filename
            $fileName = 'post_content_' . time() . '_' . Str::random(10) . '.' . $imageType;
            $storagePath = 'public/posts/content_images';
            $fullPath = storage_path('app/' . $storagePath . '/' . $fileName);

            // Ensure directory exists
            if (!File::exists(storage_path('app/' . $storagePath))) {
                File::makeDirectory(storage_path('app/' . $storagePath), 0755, true);
            }

            // Save image file
            if (File::put($fullPath, $imageBinary)) {
                // Generate URL for the saved image
                return Storage::url('posts/content_images/' . $fileName);
            }

            return null;
        } catch (\Exception $e) {
            Log::error('Error storing base64 image: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Clean up old unused content images
     */
    private function cleanupOldContentImages($oldContent, $newContent)
    {
        if (empty($oldContent)) {
            return;
        }

        // Extract image URLs from old content
        preg_match_all('/src="([^"]*\/storage\/posts\/content_images\/[^"]+)"/', $oldContent, $matches);

        if (empty($matches[1])) {
            return;
        }

        // Check each old URL to see if it's still in new content
        foreach ($matches[1] as $oldUrl) {
            if (!str_contains($newContent, $oldUrl)) {
                // URL is not in new content, delete the file
                $this->deleteContentImageByUrl($oldUrl);
            }
        }
    }

    /**
     * Delete content image by URL
     */
    private function deleteContentImageByUrl($url)
    {
        try {
            // Extract filename from URL
            $path = parse_url($url, PHP_URL_PATH);
            $filename = basename($path);

            // Delete from storage
            $filePath = 'public/posts/content_images/' . $filename;
            if (Storage::exists($filePath)) {
                Storage::delete($filePath);
            }
        } catch (\Exception $e) {
            Log::error('Error deleting content image: ' . $e->getMessage());
        }
    }

    /**
     * Upload a file to storage
     */
    private function uploadFile($file, $path, $oldFile = null)
    {
        try {
            // Delete old file if exists
            if ($oldFile) {
                $this->deleteFile($oldFile);
            }

            // Generate unique filename
            $extension = $file->getClientOriginalExtension();
            $filename = Str::random(20) . '_' . time() . '.' . $extension;

            // Store file
            $filePath = $file->storeAs($path, $filename);

            return $filePath;
        } catch (\Exception $e) {
            Log::error('File upload error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Delete a file from storage
     */
    private function deleteFile($filePath)
    {
        try {
            if ($filePath && Storage::exists($filePath)) {
                Storage::delete($filePath);
                return true;
            }
            return false;
        } catch (\Exception $e) {
            Log::error('Error deleting file: ' . $e->getMessage());
            return false;
        }
    }


    /**
     * Optional: Compress base64 images in content
     */
    private function compressBase64Images($content)
    {
        if (empty($content)) {
            return $content;
        }

        preg_match_all('/src="(data:image\/([^;]+);base64,([^"]+))"/', $content, $matches);

        if (empty($matches[0])) {
            return $content;
        }

        foreach ($matches[0] as $key => $fullMatch) {

            $base64String = $matches[1][$key];
            $imageType    = strtolower($matches[2][$key]);
            $base64Data   = $matches[3][$key];

            // Base64 → binary size
            $imageSize = (strlen($base64Data) * 3) / 4;

            // Decode image
            $imageBinary = base64_decode($base64Data);

            if (!$imageBinary) {
                continue;
            }

            // Create GD image
            $image = imagecreatefromstring($imageBinary);
            if (!$image) {
                continue;
            }

            // Generate filename
            $fileName = 'editor_' . time() . '_' . Str::random(8) . '.jpg';

            // Save to temp buffer
            ob_start();
            if ($imageSize > 500000) {
                Log::info('Compressing large base64 image: ' . round($imageSize / 1024) . 'KB');
                imagejpeg($image, null, 70);
            } else {
                imagejpeg($image, null, 90);
            }
            $jpegData = ob_get_clean();

            imagedestroy($image);

            // Upload directly to S3
            $s3Path = 'editor/' . $fileName;
            try {
                Storage::disk('s3')->put($s3Path, $jpegData);
                // Build the S3 public URL
                $newSrc = 'https://muslimhall.s3.ap-south-1.amazonaws.com/' . $s3Path;
            } catch (\Throwable $uploadErr) {
                Log::error('Editor image S3 upload failed: ' . $uploadErr->getMessage());
                // Fallback: save locally
                $localDir = storage_path('app/public/editor/');
                if (!file_exists($localDir)) {
                    mkdir($localDir, 0755, true);
                }
                file_put_contents($localDir . $fileName, $jpegData);
                $newSrc = '/storage/editor/' . $fileName;
            }

            // Replace base64 with the stored image URL
            $content = str_replace($base64String, $newSrc, $content);
        }

        return $content;
    }

    /**
     * Attach a completed chunk-uploaded file to a post and dispatch the processing job.
     */
    public function attachMedia(Request $request, $postId)
    {
        $request->validate([
            'temp_path' => 'required|string',
            'type' => 'required|string|in:video,pdf,audio,audio_single',
        ]);

        $post = Post::findOrFail($postId);
        $tempPath = $request->temp_path;
        $type = $request->type;

        try {
            if ($type === 'audio_single') {
                ServiceClass::dispatchLargeFileJob($tempPath, 'posts/audios', 'posts', 'audio', $post->id);
            } elseif ($type === 'video') {
                // Find a row that is still 'processing'
                $video = $post->videos()->where('video', 'processing')->first();
                if (!$video) $video = $post->videos()->create(['video' => 'processing']);
                ServiceClass::dispatchLargeFileJob($tempPath, 'posts/videos', 'post_videos', 'video', $video->id);
            } elseif ($type === 'pdf') {
                $pdf = $post->pdfs()->where('pdf', 'processing')->first();
                if (!$pdf) $pdf = $post->pdfs()->create(['pdf' => 'processing']);
                ServiceClass::dispatchLargeFileJob($tempPath, 'posts/pdfs', 'post_pdfs', 'pdf', $pdf->id);
            } elseif ($type === 'audio') {
                $audio = $post->audios()->where('audio', 'processing')->first();
                if (!$audio) $audio = $post->audios()->create(['audio' => 'processing']);
                ServiceClass::dispatchLargeFileJob($tempPath, 'posts/audios', 'post_audios', 'audio', $audio->id);
            }

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
