<?php

namespace App\Http\Controllers\admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\PostStoreRequest;
use App\Http\Requests\PostUpdateRequest;
use App\Models\Category;
use App\Models\Language;
use App\Models\Post;
use App\Models\Report;
use App\Models\User;
use App\Notifications\NewPostNotification;
use App\Notifications\NewReportNotification;
use App\Notifications\PostApprovedNotification;
use App\Services\ServiceClass;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class PostController extends Controller
{
    public function index(Request $request)
    {
        $posts = Post::with(['category', 'createdBy', 'updatedBy', 'videos', 'pdfs', 'audios'])
            ->when($request->filled('search'), fn($q) => $q->where('title', 'like', '%' . $request->search . '%'))
            ->when($request->filled('status'), function ($q) use ($request) {
                if ($request->status === 'processing') {
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

        return Inertia::render('Post/Index', [
            'posts' => $posts,
            'filters' => $request->only(['search', 'status', 'category_id']),
            'categories' => $categories,
        ]);
    }

    public function create()
    {
        $categories = Category::with('language')->active()->get();

        return Inertia::render('Post/Create', [
            'categories' => $categories,
            'languages' => Language::active()->get(['id', 'name']),
            'post' => null,
            'isMember' => true,
        ]);
    }

    public function store(PostStoreRequest $request)
    {
        $validated = $request->validated();

        try {
            DB::beginTransaction();

            $thumbnailPath = null;
            $sponsorPath = null;

            if ($request->hasFile('thumbnail')) {
                $thumbnailPath = ServiceClass::uploadFile(
                    $request->file('thumbnail'),
                    'posts/thumbnails'
                );
            }

            if ($request->hasFile('sponsor')) {
                $sponsorPath = ServiceClass::uploadFile(
                    $request->file('sponsor'),
                    'posts/sponsors'
                );
            }

            $audioPath = $request->hasFile('audio') || $request->filled('audio_temp_path')
                ? 'processing'
                : null;

            $content = $validated['content'] ?? null;
            $content = $this->compressBase64Images($content);

            $post = Post::create([
                'title' => $validated['title'],
                'category_id' => $validated['category_id'],
                'lang_id' => $validated['lang_id'] ?? null,
                'status' => (int) ($validated['status'] ?? 0),
                'content' => $content,
                'pdf' => null,
                'video' => null,
                'audio' => $audioPath,
                'video_url' => $validated['video_url'] ?? null,
                'created_by' => auth()->id(),
                'thumbnail' => $thumbnailPath,
                'sponsor' => $sponsorPath,
                'permission' => Post::PERMISSION_APPROVED,
            ]);

            if ($post) {
                if ($request->hasFile('featured_images')) {
                    ServiceClass::uploadMultipleImages(
                        $request,
                        'featured_images',
                        $post,
                        'images',
                        'posts/images'
                    );
                }

                ServiceClass::syncVideos($request, 'videos', $post, 'posts/videos');
                ServiceClass::syncPdfs($request, 'pdfs', $post, 'posts/pdfs');
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

            if ($request->filled('audio_temp_path')) {
                ServiceClass::dispatchLargeFileJob(
                    $request->audio_temp_path,
                    'posts/audios',
                    'posts',
                    'audio',
                    $post->id
                );
            } elseif ($request->hasFile('audio')) {
                ServiceClass::uploadLargeFile(
                    $request->file('audio'),
                    'posts/audios',
                    'posts',
                    'audio',
                    $post->id
                );
            }

            $admins = User::whereHas('roles', function ($q) {
                $q->where('name', 'admin')
                    ->orWhere('name', 'Super Admin');
            })->get();

            Notification::send($admins, new NewPostNotification($post));

            $hasLargeFiles =
                $request->hasFile('video') || $request->filled('video_temp_path') ||
                $request->hasFile('audio') || $request->filled('audio_temp_path') ||
                $request->hasFile('pdf') || $request->filled('pdf_temp_path');

            if ($request->boolean('is_background') || $request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'postId' => $post->id,
                    'message' => 'Post created and processing in background.'
                ]);
            }

            $successMsg = $post->wasRecentlyCreated ? 'Post created successfully!' : 'Post updated successfully!';
            return to_route('admin.posts.index')->with('success', $successMsg);
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Post Store Error: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
                'request' => $request->all(),
            ]);

            return back()->with('error', 'Error: ' . $e->getMessage())->withInput();
        }
    }

    public function edit(string $id)
    {
        $post = Post::with(['images', 'language', 'category', 'videos', 'pdfs', 'audios'])->findOrFail($id);
        $categories = Category::with('language')->active()->get();

        return Inertia::render('Post/Create', [
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
                'featured_images' => $post->images->map(function ($image) {
                    return [
                        'id' => $image->id,
                        'image' => $image->image,
                        'name' => basename($image->image),
                        'url' => Storage::url($image->image),
                    ];
                }),
                'post_videos' => $post->videos->map(function ($video) {
                    return [
                        'id' => $video->id,
                        'video' => $video->video,
                        'name' => basename($video->video),
                        'url' => Storage::url($video->video),
                    ];
                }),
                'post_pdfs' => $post->pdfs->map(function ($pdf) {
                    return [
                        'id' => $pdf->id,
                        'pdf' => $pdf->pdf,
                        'name' => basename($pdf->pdf),
                        'url' => Storage::url($pdf->pdf),
                    ];
                }),
                'post_audios' => $post->audios->map(function ($audio) {
                    return [
                        'id' => $audio->id,
                        'audio' => $audio->audio,
                        'name' => basename($audio->audio),
                        'url' => Storage::url($audio->audio),
                    ];
                }),
                'created_at' => $post->created_at,
                'updated_at' => $post->updated_at,
            ],
            'languages' => Language::active()->get(['id', 'name']),
            'categories' => $categories,
            'isMember' => true,
        ]);
    }

    public function update(PostUpdateRequest $request, string $id)
    {
        Log::info('Update Request Data', $request->all());

        $post = Post::findOrFail($id);
        $validated = $request->validated();

        Log::info('Post update file check', [
            'has_thumbnail' => $request->hasFile('thumbnail'),
            'has_sponsor' => $request->hasFile('sponsor'),
            'thumbnail_name' => $request->file('thumbnail')?->getClientOriginalName(),
            'sponsor_name' => $request->file('sponsor')?->getClientOriginalName(),
        ]);

        try {
            DB::beginTransaction();

            $status = (int) ($validated['status'] ?? 0);

            $thumbnailPath = $post->thumbnail;
            $sponsorPath = $post->sponsor;
            $audioPath = $post->audio;
            $videoUrl = $validated['video_url'] ?? null;

            if ($request->boolean('remove_thumbnail')) {
                if ($post->thumbnail) {
                    ServiceClass::deleteFile($post->thumbnail);
                }
                $thumbnailPath = null;
            }

            if ($request->boolean('remove_sponsor')) {
                if ($post->sponsor) {
                    ServiceClass::deleteFile($post->sponsor);
                }
                $sponsorPath = null;
            }

            if ($request->boolean('remove_audio')) {
                if ($post->audio && $post->audio !== 'processing') {
                    ServiceClass::deleteFile($post->audio);
                }
                $audioPath = null;
            }

            if ($request->hasFile('thumbnail')) {
                if ($post->thumbnail) {
                    ServiceClass::deleteFile($post->thumbnail);
                }

                $thumbnailPath = ServiceClass::uploadFile(
                    $request->file('thumbnail'),
                    'posts/thumbnails'
                );
            }

            if ($request->hasFile('sponsor')) {
                if ($post->sponsor) {
                    ServiceClass::deleteFile($post->sponsor);
                }

                $sponsorPath = ServiceClass::uploadFile(
                    $request->file('sponsor'),
                    'posts/sponsors'
                );
            }

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

            if ($request->hasFile('audio')) {
                if ($post->audio && $post->audio !== 'processing') {
                    ServiceClass::deleteFile($post->audio);
                }

                $audioPath = ServiceClass::uploadLargeFile(
                    $request->file('audio'),
                    'posts/audios',
                    'posts',
                    'audio',
                    $post->id
                );
            } elseif ($request->filled('audio_temp_path')) {
                if ($post->audio && $post->audio !== 'processing') {
                    ServiceClass::deleteFile($post->audio);
                }

                $audioPath = ServiceClass::dispatchLargeFileJob(
                    $request->audio_temp_path,
                    'posts/audios',
                    'posts',
                    'audio',
                    $post->id
                );
            }

            $content = $this->processContentForUpdate(
                $validated['content'] ?? null,
                $post->content
            );

            $this->cleanupOldContentImages(
                $post->content,
                $content
            );

            $post->update([
                'title' => $validated['title'],
                'category_id' => $validated['category_id'] ?? null,
                'lang_id' => $validated['lang_id'] ?? null,
                'status' => $status,
                'content' => $content,
                'pdf' => null,
                'video' => null,
                'audio' => $audioPath,
                'video_url' => $videoUrl,
                'thumbnail' => $thumbnailPath,
                'sponsor' => $sponsorPath,
                'updated_by' => auth()->id(),
            ]);

            DB::commit();

            $hasLargeFiles =
                $request->hasFile('video') || $request->filled('video_temp_path') ||
                $request->hasFile('audio') || $request->filled('audio_temp_path') ||
                $request->hasFile('pdf') || $request->filled('pdf_temp_path');

            $successMsg = $hasLargeFiles
                ? 'Post updated. Large files (video/audio/pdf) are being uploaded in the background.'
                : 'Post updated successfully.';

            return to_route('admin.posts.index')->with('success', $successMsg);
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Post Update Error: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
                'request' => $request->all(),
            ]);

            return back()
                ->with('error', 'Error updating post: ' . $e->getMessage())
                ->withInput();
        }
    }

    private function processContentForUpdate($newContent, $existingContent)
    {
        if (empty($newContent)) {
            return $newContent;
        }

        if (!empty($existingContent)) {
            preg_match_all('/src="([^"]*\/storage\/[^"]+)"/', $existingContent, $matches);
        }

        preg_match_all('/src="(data:image\/([^;]+);base64,([^"]+))"/', $newContent, $matches);

        if (!empty($matches[0])) {
            foreach ($matches[0] as $key => $fullMatch) {
                $base64String = $matches[1][$key];
                $imageType = strtolower($matches[2][$key]);
                $base64Data = $matches[3][$key];

                $url = $this->storeBase64Image($base64Data, $imageType);

                if ($url) {
                    $newContent = str_replace($base64String, $url, $newContent);
                }
            }
        }

        return $newContent;
    }

    private function storeBase64Image($base64Data, $imageType)
    {
        try {
            $imageBinary = base64_decode($base64Data);

            if (!$imageBinary) {
                return null;
            }

            if (!@imagecreatefromstring($imageBinary)) {
                return null;
            }

            $fileName = 'post_content_' . time() . '_' . Str::random(10) . '.' . $imageType;
            $fullPath = public_path('uploads/editor/' . $fileName);

            if (!File::exists(public_path('uploads/editor'))) {
                File::makeDirectory(public_path('uploads/editor'), 0755, true);
            }

            if (File::put($fullPath, $imageBinary)) {
                return '/uploads/editor/' . $fileName;
            }

            return null;
        } catch (\Exception $e) {
            Log::error('Error storing base64 image: ' . $e->getMessage());
            return null;
        }
    }

    private function cleanupOldContentImages($oldContent, $newContent)
    {
        if (empty($oldContent)) {
            return;
        }

        preg_match_all('/src="([^"]*\/uploads\/editor\/[^"]+)"/', $oldContent, $matches);

        if (empty($matches[1])) {
            return;
        }

        foreach ($matches[1] as $oldUrl) {
            if (!str_contains($newContent, $oldUrl)) {
                $this->deleteContentImageByUrl($oldUrl);
            }
        }
    }

    private function deleteContentImageByUrl($url)
    {
        try {
            $path = parse_url($url, PHP_URL_PATH);
            $filename = basename($path);

            $filePath = public_path('uploads/editor/' . $filename);
            if (File::exists($filePath)) {
                File::delete($filePath);
            }
        } catch (\Exception $e) {
            Log::error('Error deleting content image: ' . $e->getMessage());
        }
    }

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
            $imageType = strtolower($matches[2][$key]);
            $base64Data = $matches[3][$key];

            $imageSize = (strlen($base64Data) * 3) / 4;
            $imageBinary = base64_decode($base64Data);

            if (!$imageBinary) {
                continue;
            }

            $image = imagecreatefromstring($imageBinary);
            if (!$image) {
                continue;
            }

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
                $newSrc = 'https://muslimhall.s3.ap-south-1.amazonaws.com/' . $s3Path;
            } catch (\Throwable $uploadErr) {
                Log::error('Admin editor image S3 upload failed: ' . $uploadErr->getMessage());
                // Fallback: save locally
                $localDir = public_path('uploads/editor/');
                if (!file_exists($localDir)) {
                    mkdir($localDir, 0755, true);
                }
                file_put_contents($localDir . $fileName, $jpegData);
                $newSrc = asset('uploads/editor/' . $fileName);
            }

            $content = str_replace($base64String, $newSrc, $content);
        }

        return $content;
    }

    public function destroy(string $id)
    {
        try {
            DB::beginTransaction();

            $post = Post::findOrFail($id);

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
            $post->reports()->delete();

            ServiceClass::deleteFile($post->image);
            ServiceClass::deleteFile($post->pdf);
            ServiceClass::deleteFile($post->video);
            ServiceClass::deleteFile($post->audio);
            ServiceClass::deleteFile($post->thumbnail);
            ServiceClass::deleteFile($post->sponsor);

            $post->delete();

            DB::commit();

            return to_route('admin.posts.index')
                ->with('success', 'Post deleted successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Post Delete Error: ' . $e->getMessage());

            return back()->with('error', 'Error deleting post: ' . $e->getMessage());
        }
    }

    public function deleteVideo(string $id)
    {
        try {
            DB::beginTransaction();
            $video = \App\Models\PostVideo::findOrFail($id);
            ServiceClass::deleteFile($video->video);
            $video->delete();
            DB::commit();
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
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
            }
            elseif ($type === 'video') {
                $video = $post->videos()->where('video', 'processing')->first();
                if (!$video) $video = $post->videos()->create(['video' => 'processing']);
                ServiceClass::dispatchLargeFileJob($tempPath, 'posts/videos', 'post_videos', 'video', $video->id);
            }
            elseif ($type === 'pdf') {
                $pdf = $post->pdfs()->where('pdf', 'processing')->first();
                if (!$pdf) $pdf = $post->pdfs()->create(['pdf' => 'processing']);
                ServiceClass::dispatchLargeFileJob($tempPath, 'posts/pdfs', 'post_pdfs', 'pdf', $pdf->id);
            }
            elseif ($type === 'audio') {
                $audio = $post->audios()->where('audio', 'processing')->first();
                if (!$audio) $audio = $post->audios()->create(['audio' => 'processing']);
                ServiceClass::dispatchLargeFileJob($tempPath, 'posts/audios', 'post_audios', 'audio', $audio->id);
            }

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function show(string $id)
    {
        $post = Post::with([
            'category',
            'images',
            'allComments',
            'section',
            'language',
            'createdBy',
            'updatedBy',
            'videos',
            'audios',
            'pdfs',
        ])->findOrFail($id);

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

        return Inertia::render('Post/Show', [
            'post' => $post,
        ]);
    }

    public function updateStatus(Post $post, Request $request)
    {
        $request->validate([
            'status' => 'required|boolean',
        ]);

        $post->update([
            'status' => $request->status,
        ]);

        return back()->with('success', 'Post status updated successfully.');
    }

    public function hidePost(Request $request, $id)
    {
        $post = Post::findOrFail($id);

        $request->validate([
            'reason' => 'nullable|string|max:500',
            'report_id' => 'nullable|exists:reports,id',
        ]);

        $post->update([
            'status' => 0,
            'hidden_reason' => $request->reason,
            'hidden_at' => now(),
            'hidden_by' => auth()->id(),
        ]);

        if ($request->report_id) {
            Report::find($request->report_id)?->update([
                'status' => 'resolved',
                'admin_note' => 'Post hidden: ' . ($request->reason ?: 'Violation of community guidelines'),
                'handled_by' => auth()->id(),
            ]);
        }

        return back()->with('success', 'Post has been hidden successfully.');
    }

    public function approved(string $id)
    {
        $post = Post::findOrFail($id);

        $post->update([
            'permission' => Post::PERMISSION_APPROVED,
        ]);

        if ($post->createdBy) {
            $post->createdBy->notify(new PostApprovedNotification($post));
        }

        return back()->with('success', 'Post has been approved successfully.');
    }

    public function rejected(string $id)
    {
        $post = Post::findOrFail($id);

        $post->update([
            'permission' => Post::PERMISSION_REJECTED,
        ]);

        return back()->with('success', 'Post has been rejected successfully.');
    }

    public function unhidePost(Request $request, $id)
    {
        $post = Post::findOrFail($id);

        $post->update([
            'status' => 1,
            'hidden_reason' => null,
            'hidden_at' => null,
            'hidden_by' => null,
        ]);

        return back()->with('success', 'Post has been unhidden successfully.');
    }
}