<?php

namespace App\Http\Controllers\admin;

use App\Http\Controllers\Controller;
use App\Models\Entry;
use App\Models\EntryImage;
use App\Models\User;
use App\Services\ServiceClass;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class EntryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = \App\Models\Entry::with(['user', 'contest']);

        // Filter by status
        if ($request->has('status') && $request->status != '') {
            $query->where('status', $request->status);
        }

        // Search functionality
        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('content', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    })
                    ->orWhereHas('contest', function ($q) use ($search) {
                        $q->where('title', 'like', "%{$search}%");
                    });
            });
        }

        $entries = $query->paginate($request->get('per_page', 10), ['*'], 'page')->appends($request->query());


        return Inertia::render('Contest/Entry/Index', [
            'entries' => $entries,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $users = \App\Models\User::where('role', User::ROLE_USER)->get();
        $contests = \App\Models\Contest::running()->get();
        return inertia('Contest/Entry/Create', compact('users', 'contests'));
    }

    /**
     * Store a newly created resource in storage.
     */



    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'user_id' => 'required|exists:users,id',
            'contest_id' => 'required|exists:contests,id',
            'content' => 'nullable|string',
            'status' => 'nullable|in:pending,approved,rejected',

            'thumbnail' => 'nullable|image|mimes:jpg,jpeg,png,gif|max:5120',
            'pdf' => 'nullable|mimes:pdf|max:20480',
            'video' => 'nullable|mimetypes:video/mp4,video/quicktime,video/x-msvideo|max:51200',
            'audio' => 'nullable|mimetypes:audio/mpeg,audio/wav|max:20480',
            'images'   => 'nullable|array',
            'images.*' => 'nullable|image|mimes:jpg,jpeg,png,gif|max:5120',
        ]);

        // Prevent duplicate entry
        $existingEntry = Entry::where('contest_id', $request->contest_id)
            ->where('user_id', $request->user_id)
            ->first();

        if ($existingEntry) {
            return back()->withErrors(['user_id' => 'This user already has an entry in this contest.']);
        }

        DB::beginTransaction();

        try {
            $user_id = Auth::user()->role == \App\Models\User::ROLE_ADMIN
                ? $request->user_id
                : Auth::id();

            $thumbnailPath = $request->hasFile('thumbnail')
                ? ServiceClass::uploadFile($request->file('thumbnail'), 'entries/thumbnails')
                : null;
            logger('Thumbnail upload path: ' . $thumbnailPath);

            $pdfPath = $request->hasFile('pdf') || $request->filled('pdf_temp_path')
                ? 'processing'
                : null;

            $videoPath = $request->hasFile('video') || $request->filled('video_temp_path')
                ? 'processing'
                : null;

            $audioPath = $request->hasFile('audio') || $request->filled('audio_temp_path')
                ? 'processing'
                : null;

            $content = $request->content ?? null;

            // Create Entry
            $entry = Entry::create([
                'title' => $request->title,
                'user_id' => $user_id,
                'contest_id' => $request->contest_id,
                'content' => $content,
                'status' => $request->status ?? 'pending',
                'thumbnail' => $thumbnailPath,
                'pdf' => $pdfPath,
                'video' => $videoPath,
                'audio' => $audioPath,
            ]);

            // Handle gallery images
            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $image) {
                    $path = ServiceClass::uploadFile($image, 'entries/gallery');
                    EntryImage::create([
                        'entries_id' => $entry->id,
                        'image' => $path,
                    ]);
                }
            }

            DB::commit();

            // Dispatch background jobs for large files AFTER entry is created
            if ($request->hasFile('video')) {
                ServiceClass::uploadLargeFile($request->file('video'), 'entries/videos', 'entries', 'video', $entry->id);
            } elseif ($request->filled('video_temp_path')) {
                ServiceClass::dispatchLargeFileJob($request->video_temp_path, 'entries/videos', 'entries', 'video', $entry->id);
            }

            if ($request->hasFile('audio')) {
                ServiceClass::uploadLargeFile($request->file('audio'), 'entries/audios', 'entries', 'audio', $entry->id);
            } elseif ($request->filled('audio_temp_path')) {
                ServiceClass::dispatchLargeFileJob($request->audio_temp_path, 'entries/audios', 'entries', 'audio', $entry->id);
            }

            if ($request->hasFile('pdf')) {
                ServiceClass::uploadLargeFile($request->file('pdf'), 'entries/pdfs', 'entries', 'pdf', $entry->id);
            } elseif ($request->filled('pdf_temp_path')) {
                ServiceClass::dispatchLargeFileJob($request->pdf_temp_path, 'entries/pdfs', 'entries', 'pdf', $entry->id);
            }

            $hasLargeFiles = $request->hasFile('video') || $request->filled('video_temp_path') || 
                             $request->hasFile('audio') || $request->filled('audio_temp_path') || 
                             $request->hasFile('pdf') || $request->filled('pdf_temp_path');
            $successMsg = $hasLargeFiles
                ? 'Entry created. Large files are being uploaded in the background.'
                : 'Entry created successfully.';

            return to_route('admin.entries.index')->with('success', $successMsg);
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Entry Store Error: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
                'request' => $request->all(),
            ]);

            return back()->with('error', 'Error: ' . $e->getMessage())->withInput();
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $entry = \App\Models\Entry::with(['user', 'contest', 'votes', 'images'])->findOrFail($id);
        return inertia('Contest/Entry/Show', compact('entry'));
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        $entry = \App\Models\Entry::with('images')->findOrFail($id);
        $users = \App\Models\User::where('role', User::ROLE_USER)->get();

        $contests = \App\Models\Contest::running()
            ->get()
            ->merge(\App\Models\Contest::where('id', $entry->contest_id)->get())
            ->unique('id')
            ->values();

        return inertia('Contest/Entry/Edit', [
            'entry'    => $entry,
            'users'    => $users,
            'contests' => $contests,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */


    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $request->validate([
            'title'      => 'required|string|max:255',
            'user_id'    => 'required|exists:users,id',
            'contest_id' => 'required|exists:contests,id',
            'content'    => 'nullable|string',
            'status'     => 'nullable|in:pending,approved,rejected',

            'thumbnail'  => 'nullable|image|mimes:jpg,jpeg,png,gif|max:5120',
            'pdf'        => 'nullable|mimes:pdf|max:20480',
            'video'      => 'nullable|mimetypes:video/mp4,video/quicktime,video/x-msvideo|max:51200',
            'audio'      => 'nullable|mimetypes:audio/mpeg,audio/wav|max:20480',
            'images.*'   => 'nullable|image|mimes:jpg,jpeg,png,gif|max:5120',

            'remove_thumbnail' => 'nullable|boolean',
            'remove_pdf'       => 'nullable|boolean',
            'remove_video'     => 'nullable|boolean',
            'remove_audio'     => 'nullable|boolean',
            'remove_images'    => 'nullable|array',
            'remove_images.*'  => 'nullable|integer',
        ]);

        $entry = Entry::findOrFail($id);

        DB::beginTransaction();

        try {
            // ── Thumbnail ──────────────────────────────────────────────────────
            if ($request->hasFile('thumbnail')) {
                // Delete old
                if ($entry->thumbnail) {
                    ServiceClass::deleteFile($entry->thumbnail);
                }
                $thumbnailPath = ServiceClass::uploadFile($request->file('thumbnail'), 'entries/thumbnails');
            } elseif ($request->boolean('remove_thumbnail')) {
                if ($entry->thumbnail) {
                    ServiceClass::deleteFile($entry->thumbnail);
                }
                $thumbnailPath = null;
            } else {
                $thumbnailPath = $entry->thumbnail; // unchanged
            }

            // ── PDF ────────────────────────────────────────────────────────────
            if ($request->hasFile('pdf')) {
                if ($entry->pdf && $entry->pdf !== 'processing') {
                    ServiceClass::deleteFile($entry->pdf);
                }
                $pdfPath = ServiceClass::uploadLargeFile($request->file('pdf'), 'entries/pdfs', 'entries', 'pdf', $entry->id);
            } elseif ($request->filled('pdf_temp_path')) {
                if ($entry->pdf && $entry->pdf !== 'processing') {
                    ServiceClass::deleteFile($entry->pdf);
                }
                $pdfPath = ServiceClass::dispatchLargeFileJob($request->pdf_temp_path, 'entries/pdfs', 'entries', 'pdf', $entry->id);
            } elseif ($request->boolean('remove_pdf')) {
                if ($entry->pdf) {
                    ServiceClass::deleteFile($entry->pdf);
                }
                $pdfPath = null;
            } else {
                $pdfPath = $entry->pdf;
            }

            // ── Video ──────────────────────────────────────────────────────────
            if ($request->hasFile('video')) {
                if ($entry->video && $entry->video !== 'processing') {
                    ServiceClass::deleteFile($entry->video);
                }
                $videoPath = ServiceClass::uploadLargeFile($request->file('video'), 'entries/videos', 'entries', 'video', $entry->id);
            } elseif ($request->filled('video_temp_path')) {
                if ($entry->video && $entry->video !== 'processing') {
                    ServiceClass::deleteFile($entry->video);
                }
                $videoPath = ServiceClass::dispatchLargeFileJob($request->video_temp_path, 'entries/videos', 'entries', 'video', $entry->id);
            } elseif ($request->boolean('remove_video')) {
                if ($entry->video) {
                    ServiceClass::deleteFile($entry->video);
                }
                $videoPath = null;
            } else {
                $videoPath = $entry->video;
            }

            // ── Audio ──────────────────────────────────────────────────────────
            if ($request->hasFile('audio')) {
                if ($entry->audio && $entry->audio !== 'processing') {
                    ServiceClass::deleteFile($entry->audio);
                }
                $audioPath = ServiceClass::uploadLargeFile($request->file('audio'), 'entries/audios', 'entries', 'audio', $entry->id);
            } elseif ($request->filled('audio_temp_path')) {
                if ($entry->audio && $entry->audio !== 'processing') {
                    ServiceClass::deleteFile($entry->audio);
                }
                $audioPath = ServiceClass::dispatchLargeFileJob($request->audio_temp_path, 'entries/audios', 'entries', 'audio', $entry->id);
            } elseif ($request->boolean('remove_audio')) {
                if ($entry->audio) {
                    ServiceClass::deleteFile($entry->audio);
                }
                $audioPath = null;
            } else {
                $audioPath = $entry->audio;
            }

            // ── Update Entry ───────────────────────────────────────────────────
            $entry->update([
                'title'      => $request->title,
                'user_id'    => $request->user_id,
                'contest_id' => $request->contest_id,
                'content'    => $request->content ?? null,
                'status'     => $request->status ?? $entry->status,
                'thumbnail'  => $thumbnailPath,
                'pdf'        => $pdfPath,
                'video'      => $videoPath,
                'audio'      => $audioPath,
            ]);

            // ── Remove gallery images ──────────────────────────────────────────
            if ($request->filled('remove_images')) {
                $imagesToRemove = EntryImage::where('entries_id', $entry->id)
                    ->whereIn('id', $request->remove_images)
                    ->get();

                foreach ($imagesToRemove as $img) {
                    ServiceClass::deleteFile($img->image);
                    $img->delete();
                }
            }

            // ── Add new gallery images ─────────────────────────────────────────
            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $image) {
                    $path = ServiceClass::uploadFile($image, 'entries/gallery');
                    EntryImage::create([
                        'entries_id'   => $entry->id,
                        'image' => $path,
                    ]);
                }
            }

            DB::commit();

            $hasLargeFiles = $request->hasFile('video') || $request->filled('video_temp_path') || 
                             $request->hasFile('audio') || $request->filled('audio_temp_path') || 
                             $request->hasFile('pdf') || $request->filled('pdf_temp_path');
            $successMsg = $hasLargeFiles
                ? 'Entry updated. Large files are being uploaded in the background.'
                : 'Entry updated successfully.';

            return to_route('admin.entries.index')->with('success', $successMsg);
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Entry Update Error: ' . $e->getMessage(), [
                'file'    => $e->getFile(),
                'line'    => $e->getLine(),
                'trace'   => $e->getTraceAsString(),
                'request' => $request->all(),
            ]);

            return back()->with('error', 'Error: ' . $e->getMessage())->withInput();
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $entry = \App\Models\Entry::findOrFail($id);
        if ($entry->media_path && Storage::exists($entry->media_path)) {
            Storage::delete($entry->media_path);
        }
        $entry->delete();
        return to_route('admin.entries.index')->with('success', 'Entry deleted successfully.');
    }
    public function destroyEntry(string $id)
    {
        $entry = \App\Models\Entry::findOrFail($id);

        if ($entry->media_path && Storage::exists($entry->media_path)) {
            Storage::delete($entry->media_path);
        }

        $entry->delete();

        return back(); // stays on same page without white screen
    }
    public function disqualify(Entry $entry)
    {
        $entry->update(['is_disqualify' => true]);

        return back()->with('success', 'Entry disqualified successfully.');
    }
}
