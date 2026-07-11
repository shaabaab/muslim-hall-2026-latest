<?php

namespace App\Http\Controllers\user;

use App\Http\Controllers\Controller;
use App\Models\IslamicZone;
use App\Models\Language;
use App\Services\ServiceClass;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;

class IslamicZoneController extends Controller
{
    public function index(Request $request)
    {
        $resources = IslamicZone::with(['language', 'audios', 'videos', 'pdfs'])
            ->where('user_id', Auth::id())
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('type'), fn ($q) => $q->where('type', $request->type))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->status))
            ->latest()
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('User/IslamicZone/Index', [
            'resources' => $resources,
            'filters' => $request->only(['search', 'type', 'status']),
        ]);
    }

    public function create()
    {
        return Inertia::render('User/IslamicZone/Create', [
            'langs' => Language::active()->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate($this->rules($request));
        $validated['user_id'] = Auth::id();
        $validated['slug'] = $this->generateUniqueSlug($request->title);
        $validated['is_featured'] = false;
        // User/member upload must wait for admin approval. Admin approves by setting status = published.
        $validated['status'] = IslamicZone::STATUS_DRAFT;

        $this->uploadSingleFiles($request, $validated);
        $this->uploadGallery($request, $validated);

        $resource = IslamicZone::create($validated);
        $this->syncMultipleMedia($request, $resource);
        $this->dispatchLargeFiles($request, $resource);

        return $this->successResponse($request, 'Islamic content submitted successfully. Admin approval is required before it appears on the website.');
    }

    public function show(IslamicZone $religiousContent)
    {
        $this->authorizeOwner($religiousContent);
        return redirect()->route('islamic-detail', $religiousContent->id);
    }

    public function edit(IslamicZone $religiousContent)
    {
        $this->authorizeOwner($religiousContent);
        $religiousContent->load(['audios', 'videos', 'pdfs']);

        return Inertia::render('User/IslamicZone/Edit', [
            'resource' => [
                'id' => $religiousContent->id,
                'title' => $religiousContent->title,
                'description' => $religiousContent->description,
                'type' => $religiousContent->type,
                'calendar_type' => $religiousContent->calendar_type,
                'image' => $religiousContent->image,
                'gallery' => $religiousContent->gallery,
                'content_text' => $religiousContent->content_text,
                'youtube_url' => $religiousContent->youtube_url,
                'is_featured' => $religiousContent->is_featured,
                'status' => $religiousContent->status,
                'lang_id' => $religiousContent->lang_id,
                'islamic_videos' => $religiousContent->videos->map(fn ($video) => [
                    'id' => $video->id,
                    'video' => $video->video,
                    'name' => basename($video->video),
                    'url' => ServiceClass::getFileUrl($video->video),
                ]),
                'islamic_pdfs' => $religiousContent->pdfs->map(fn ($pdf) => [
                    'id' => $pdf->id,
                    'pdf' => $pdf->pdf,
                    'name' => basename($pdf->pdf),
                    'url' => ServiceClass::getFileUrl($pdf->pdf),
                ]),
                'islamic_audios' => $religiousContent->audios->map(fn ($audio) => [
                    'id' => $audio->id,
                    'audio' => $audio->audio,
                    'name' => basename($audio->audio),
                    'url' => ServiceClass::getFileUrl($audio->audio),
                ]),
            ],
            'langs' => Language::active()->get(),
        ]);
    }

    public function update(Request $request, IslamicZone $religiousContent)
    {
        $this->authorizeOwner($religiousContent);

        $validated = $request->validate($this->rules($request, true));
        $validated['slug'] = $this->generateUniqueSlug($request->title, $religiousContent->id);
        $validated['is_featured'] = $religiousContent->is_featured;
        // After user edits, send it back to draft so admin can approve the edited content.
        $validated['status'] = IslamicZone::STATUS_DRAFT;

        $this->uploadSingleFiles($request, $validated, $religiousContent);
        $this->uploadGallery($request, $validated, $religiousContent);

        $religiousContent->update($validated);
        $this->syncMultipleMedia($request, $religiousContent);
        $this->dispatchLargeFiles($request, $religiousContent);

        return $this->successResponse($request, 'Islamic content updated successfully. Admin approval is required before it appears on the website.');
    }

    public function destroy(IslamicZone $religiousContent)
    {
        $this->authorizeOwner($religiousContent);

        foreach (['image', 'document_file', 'audio_file', 'video_file'] as $field) {
            if ($religiousContent->{$field} && $religiousContent->{$field} !== 'processing') {
                ServiceClass::deleteFile($religiousContent->{$field});
            }
        }

        foreach ((array) $religiousContent->gallery as $galleryFile) {
            if ($galleryFile) {
                ServiceClass::deleteFile($galleryFile);
            }
        }

        foreach ($religiousContent->videos as $video) {
            ServiceClass::deleteFile($video->video);
            $video->delete();
        }
        foreach ($religiousContent->pdfs as $pdf) {
            ServiceClass::deleteFile($pdf->pdf);
            $pdf->delete();
        }
        foreach ($religiousContent->audios as $audio) {
            ServiceClass::deleteFile($audio->audio);
            $audio->delete();
        }

        $religiousContent->delete();

        return back()->with('success', 'Islamic content deleted successfully.');
    }

    public function download(IslamicZone $religiousContent)
    {
        $this->authorizeOwner($religiousContent);

        $filePath = $religiousContent->document_file ?: optional($religiousContent->pdfs()->first())->pdf;
        abort_if(!$filePath || $filePath === 'processing', 404, 'File not found');

        return redirect()->away(ServiceClass::getFileUrl($filePath));
    }

    private function rules(Request $request, bool $isUpdate = false): array
    {
        return [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:quran,hadith,calendar,islamicContent',
            'calendar_type' => 'nullable|required_if:type,calendar|in:islamic,ramadan,yearly',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp,gif,svg|max:2048000',
            'gallery' => 'nullable|array',
            'gallery.*' => 'nullable|image|mimes:jpg,jpeg,png,webp,gif,svg|max:2048000',
            'document_file' => 'nullable|file|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,txt,csv,zip,rar,7z|max:2048000',
            'content_text' => 'nullable|string|max:100000',
            'youtube_url' => 'nullable|url|max:500',
            'audio_file' => 'nullable|file|mimes:mp3,wav,ogg,m4a,aac,flac,webm|max:2048000',
            'video_file' => 'nullable|file|mimes:mp4,mov,avi,mkv,webm,wmv,flv,m4v|max:2048000',
            'pdfs' => 'nullable|array',
            'pdfs.*' => 'nullable|file|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,txt,csv,zip,rar,7z|max:2048000',
            'videos' => 'nullable|array',
            'videos.*' => 'nullable|file|mimes:mp4,mov,avi,mkv,webm,wmv,flv,m4v|max:2048000',
            'audios' => 'nullable|array',
            'audios.*' => 'nullable|file|mimes:mp3,wav,ogg,m4a,aac,flac,webm|max:2048000',
            'video_file_temp_path' => 'nullable|string',
            'audio_file_temp_path' => 'nullable|string',
            'document_file_temp_path' => 'nullable|string',
            'video_temp_paths' => 'nullable|array',
            'audio_temp_paths' => 'nullable|array',
            'pdf_temp_paths' => 'nullable|array',
            'remove_videos' => 'nullable|array',
            'remove_audios' => 'nullable|array',
            'remove_pdfs' => 'nullable|array',
            'lang_id' => 'nullable|exists:languages,id',
        ];
    }

    private function uploadSingleFiles(Request $request, array &$validated, ?IslamicZone $old = null): void
    {
        $map = [
            'image' => 'islamic-zone/images',
            'video_file' => 'islamic-zone/video',
            'audio_file' => 'islamic-zone/audio',
            'document_file' => 'islamic-zone/ebooks',
        ];

        foreach ($map as $field => $folder) {
            if ($request->hasFile($field)) {
                if ($old && $old->{$field} && $old->{$field} !== 'processing') {
                    ServiceClass::deleteFile($old->{$field});
                }
                $validated[$field] = ServiceClass::uploadFile($request->file($field), $folder);
                if ($field !== 'image') {
                    $validated['file_size'] = $request->file($field)->getSize();
                }
            }
        }

        foreach (['video_file', 'audio_file', 'document_file'] as $field) {
            $tempField = $field . '_temp_path';
            if ($request->filled($tempField)) {
                if ($old && $old->{$field} && $old->{$field} !== 'processing') {
                    ServiceClass::deleteFile($old->{$field});
                }
                $validated[$field] = 'processing';
            }
        }
    }

    private function uploadGallery(Request $request, array &$validated, ?IslamicZone $old = null): void
    {
        if (!$request->hasFile('gallery')) {
            return;
        }

        if ($old) {
            foreach ((array) $old->gallery as $galleryFile) {
                if ($galleryFile) {
                    ServiceClass::deleteFile($galleryFile);
                }
            }
        }

        $validated['gallery'] = collect($request->file('gallery'))
            ->map(fn ($file) => ServiceClass::uploadFile($file, 'islamic-zone/gallery'))
            ->values()
            ->all();
    }

    private function syncMultipleMedia(Request $request, IslamicZone $resource): void
    {
        ServiceClass::syncVideos($request, 'videos', $resource, 'islamic-zone/video', 'islamic_zone_videos');
        ServiceClass::syncPdfs($request, 'pdfs', $resource, 'islamic-zone/ebooks', 'islamic_zone_pdfs');
        ServiceClass::syncAudios($request, 'audios', $resource, 'islamic-zone/audio', 'islamic_zone_audios');
    }

    private function dispatchLargeFiles(Request $request, IslamicZone $resource): void
    {
        if ($request->filled('video_file_temp_path')) {
            ServiceClass::dispatchLargeFileJob($request->video_file_temp_path, 'islamic-zone/video', 'islamic_zones', 'video_file', $resource->id);
        }
        if ($request->filled('audio_file_temp_path')) {
            ServiceClass::dispatchLargeFileJob($request->audio_file_temp_path, 'islamic-zone/audio', 'islamic_zones', 'audio_file', $resource->id);
        }
        if ($request->filled('document_file_temp_path')) {
            ServiceClass::dispatchLargeFileJob($request->document_file_temp_path, 'islamic-zone/ebooks', 'islamic_zones', 'document_file', $resource->id);
        }
    }

    private function authorizeOwner(IslamicZone $resource): void
    {
        abort_if((int) $resource->user_id !== (int) Auth::id(), 403, 'Unauthorized Islamic Zone content.');
    }

    private function successResponse(Request $request, string $message)
    {
        if ($request->expectsJson() || $request->ajax()) {
            return response()->json(['success' => true, 'message' => $message]);
        }

        return redirect()->route('user.islamic-zone.index')->with('success', $message);
    }

    private function generateUniqueSlug(string $title, ?int $ignoreId = null): string
    {
        $slug = Str::slug($title) ?: 'islamic-content';
        $query = IslamicZone::where('slug', 'like', $slug . '%');
        if ($ignoreId) {
            $query->where('id', '!=', $ignoreId);
        }

        $count = $query->count();
        return $count > 0 ? $slug . '-' . ($count + 1) : $slug;
    }
}
