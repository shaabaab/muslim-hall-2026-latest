<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Language;
use App\Models\IslamicZone;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use App\Services\ServiceClass;

class IslamicZoneController extends Controller
{

    //index function 
    public function index(Request $request)
    {
        $query = IslamicZone::with(['user', 'language'])->latest();

        if ($request->has('search')) {
            $query->where('title', 'like', '%' . $request->search . '%')
                ->orWhere('description', 'like', '%' . $request->search . '%');
        }

        if ($request->has('type') && $request->type !== '') {
            $query->where('type', $request->type);
        }

        if ($request->has('status') && $request->status !== '') {
            $query->where('status', $request->status);
        }

        $resources = $query->paginate(12);

        return Inertia::render('IslamicZone/Index', [
            'resources' => $resources,
            'filters' => $request->only(['search', 'type', 'status'])
        ]);
    }


    //create function
    public function create()
    {
        $langs = Language::active()->get();
        return Inertia::render('IslamicZone/Create', ['langs' => $langs]);
    }


    // store function
    public function store(Request $request)
    {
        // dd($request->all());
        // $rules = [
        //     'title' => 'required|string|max:255',
        //     'type' => 'required|in:quran,hadith,calendar,islamicContent',
        //     'description' => 'nullable|string',
        //     'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
        //     'gallery' => 'nullable|array',
        //     'gallery.*' => 'image|mimes:jpeg,png,jpg,gif|max:5120',
        //     'document_file' => 'nullable|file|mimes:pdf',
        //     'content_text' => 'nullable|string|max:100000',
        //     'youtube_url' => 'nullable|url|max:500',
        //     'audio_file' => 'nullable|file|mimes:mp3,wav,ogg',
        //     'video_file' => 'nullable|file|mimes:mp4,avi,mov',
        //     'is_featured' => 'boolean',
        //     'status' => 'required|in:draft,published,archived',
        //     'type' => 'required|in:quran,hadith,calendar,islamicContent',
        //     'calendar_type' => 'nullable|required_if:type,calendar|in:islamic,ramadan,yearly',
        //     'lang_id' => 'nullable|exists:languages,id',
        // ];
        $rules = [
    'title' => 'required|string|max:255',  // Required
    'description' => 'nullable|string',
    'type' => 'nullable|in:quran,hadith,calendar,islamicContent',
    'image' => 'nullable|image',
    'gallery' => 'nullable|array',
    'gallery.*' => 'nullable|image',
    'document_file' => 'nullable|file|mimes:pdf',
    'content_text' => 'nullable|string|max:100000',
    'youtube_url' => 'nullable|url|max:500',
    'audio_file' => 'nullable|file',
    'video_file' => 'nullable|file',
    'is_featured' => 'nullable|boolean',
    'status' => 'nullable|in:draft,published,archived',
    'lang_id' => 'nullable|exists:languages,id',
    'calendar_type' => 'nullable|in:islamic,ramadan,yearly',
];



        // if ($request->type == 'islamicContent' || $request->type == 'quran' || $request->type == 'hadith') {
        //     if ($request->type == 'islamicContent') {
        //         $rules['image'] = 'required|image|mimes:jpeg,png,jpg,gif|max:5120';
        //     }
        //     $rules['pdfs'] = 'nullable|array';
        //     $rules['pdfs.*'] = 'nullable|file|mimes:pdf';
        //     if (!$request->pdf_temp_paths && !$request->hasFile('pdfs')) {
        //         $rules['pdfs'] = 'required|array|min:1';
        //     }
        // }
        if ($request->type == 'islamicContent' || $request->type == 'quran' || $request->type == 'hadith') {
    // শুধুমাত্র Title required
    $rules['image'] = 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120';  // optional
    $rules['pdfs'] = 'nullable|array';                                   // optional
    $rules['pdfs.*'] = 'nullable|file|mimes:pdf';                        // optional
}

        $rules['video_temp_paths'] = 'nullable|array';
        $rules['audio_temp_paths'] = 'nullable|array';
        $rules['pdf_temp_paths'] = 'nullable|array';

        $validated = $request->validate($rules);

        // Convert is_featured to boolean
        $validated['is_featured'] = filter_var($request->is_featured, FILTER_VALIDATE_BOOLEAN);

        // Handle file uploads
        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('islamic-zone/images');
        }

        // Document file and pdf backward compatibility are not used anymore for multiple uploads, skipping single pdf storage
        $pdfTempPath = null;


        if ($request->hasFile('video_file')) {
            $validated['video_file'] = $request->file('video_file')->store('islamic-zone/video');
            $validated['file_size'] = $request->file('video_file')->getSize();
            $videoTempPath = null;
        } else {
            $videoTempPath = $request->video_file_temp_path;
            if ($videoTempPath) {
                $validated['video_file'] = 'processing';
            }
        }

        if ($request->hasFile('audio_file')) {
            $validated['audio_file'] = $request->file('audio_file')->store('islamic-zone/audio');
            $validated['file_size'] = $request->file('audio_file')->getSize();
            $audioTempPath = null;
        } else {
            $audioTempPath = $request->audio_file_temp_path;
            if ($audioTempPath) {
                $validated['audio_file'] = 'processing';
            }
        }

        if ($request->hasFile('document_file')) {
            $validated['document_file'] = $request->file('document_file')->store('islamic-zone/ebooks');
            $validated['file_size'] = $request->file('document_file')->getSize();
            $docTempPath = null;
        } else {
            $docTempPath = $request->document_file_temp_path;
            if ($docTempPath) {
                $validated['document_file'] = 'processing';
            }
        }

        // Handle gallery images
        if ($request->hasFile('gallery')) {
            $galleryPaths = [];
            foreach ($request->file('gallery') as $galleryFile) {
                $galleryPaths[] = $galleryFile->store('islamic-zone/gallery');
            }
            $validated['gallery'] = json_encode($galleryPaths);
        }

        $validated['user_id'] = Auth::id();
        $validated['slug'] = $this->generateUniqueSlug($request->title);
        $validated['lang_id'] = $request->lang_id;

        $resource = IslamicZone::create($validated);

        if ($resource) {
            // Handle multiple videos
            ServiceClass::syncVideos($request, 'videos', $resource, 'islamic-zone/video', 'islamic_zone_videos');
            
            // Handle multiple pdfs
            ServiceClass::syncPdfs($request, 'pdfs', $resource, 'islamic-zone/ebooks', 'islamic_zone_pdfs');

            // Handle multiple audios
            ServiceClass::syncAudios($request, 'audios', $resource, 'islamic-zone/audio', 'islamic_zone_audios');
        }

        $hasLargeFiles = $request->filled('video_temp_paths') || $request->filled('audio_temp_paths') || $request->filled('pdf_temp_paths') || 
                         $request->hasFile('videos') || $request->hasFile('audios') || $request->hasFile('pdfs');

        return to_route('admin.islamic-zone.index')
            ->with('success', $hasLargeFiles 
                ? 'Religious content created. Large files are being processed in the background.' 
                : 'Religious content created successfully.');
    }


    //show method
    public function show(IslamicZone $religiousContent)
    {
        $religiousContent->load(['user', 'language']);

        // Decode gallery if it exists
        if ($religiousContent->gallery) {
            $religiousContent->gallery = json_decode($religiousContent->gallery, true);
        }

        return Inertia::render('IslamicZone/Show', [
            'resource' => $religiousContent
        ]);
    }


    //edit method 
    public function edit($id)
    {
        $religiousContent = IslamicZone::with(['audios', 'videos', 'pdfs'])->findOrFail($id);
        $langs = Language::active()->get();
        return Inertia::render('IslamicZone/Edit', [
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
                'islamic_videos' => $religiousContent->videos->map(function ($video) {
                    return [
                        'id' => $video->id,
                        'video' => $video->video,
                        'name' => basename($video->video),
                        'url' => Storage::url($video->video)
                    ];
                }),
                'islamic_pdfs' => $religiousContent->pdfs->map(function ($pdf) {
                    return [
                        'id' => $pdf->id,
                        'pdf' => $pdf->pdf,
                        'name' => basename($pdf->pdf),
                        'url' => Storage::url($pdf->pdf)
                    ];
                }),
                'islamic_audios' => $religiousContent->audios->map(function ($audio) {
                    return [
                        'id' => $audio->id,
                        'audio' => $audio->audio,
                        'name' => basename($audio->audio),
                        'url' => Storage::url($audio->audio)
                    ];
                }),
            ],
            'langs' => $langs
        ]);
    }


    public function update(Request $request, string $id)
    {
        $religiousContent = IslamicZone::findOrFail($id);

        // $rules = [
        //     'title' => 'required|string|max:255',
        //     'description' => 'nullable|string',
        //     'type' => 'required|in:quran,hadith,calendar,islamicContent',
        //     'calendar_type' => 'nullable|required_if:type,calendar|in:islamic,ramadan,yearly',
        //     'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
        //     'gallery' => 'nullable|array',
        //     'gallery.*' => 'image|mimes:jpeg,png,jpg,gif|max:5120',
        //     // Large files are stored to temp then uploaded via queue job — no max limit here
        //     'document_file' => 'nullable|file|mimes:pdf',
        //     'content_text' => 'nullable|string|max:100000',
        //     'youtube_url' => 'nullable|url|max:500',
        //     'audio_file' => 'nullable|file|mimes:mp3,wav,ogg',
        //     'video_file' => 'nullable|file|mimes:mp4,avi,mov',
        //     'is_featured' => 'boolean',
        //     'status' => 'required|in:draft,published,archived',
        //     'lang_id' => 'nullable|exists:languages,id',
        //     'video_file_temp_path' => 'nullable|string',
        //     'audio_file_temp_path' => 'nullable|string',
        //     'document_file_temp_path' => 'nullable|string',
        //     'pdf_temp_path' => 'nullable|string', // Added pdf_temp_path
        // ];
        $rules = [
    'title' => 'required|string|max:255',  // Required
    'description' => 'nullable|string',
    'type' => 'nullable|in:quran,hadith,calendar,islamicContent',
    'image' => 'nullable|image',
    'gallery' => 'nullable|array',
    'gallery.*' => 'nullable|image',
    'document_file' => 'nullable|file|mimes:pdf',
    'content_text' => 'nullable|string|max:100000',
    'youtube_url' => 'nullable|url|max:500',
    'audio_file' => 'nullable|file',
    'video_file' => 'nullable|file',
    'is_featured' => 'nullable|boolean',
    'status' => 'nullable|in:draft,published,archived',
    'lang_id' => 'nullable|exists:languages,id',
    'calendar_type' => 'nullable|in:islamic,ramadan,yearly',
];


        // if ($request->type == 'islamicContent' || $request->type == 'quran' || $request->type == 'hadith') {
        //     if ($request->type == 'islamicContent') {
        //         $rules['image'] = 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120';
        //     }
        //     $rules['pdfs'] = 'nullable|array';
        //     $rules['pdfs.*'] = 'nullable|file|mimes:pdf';
        // }

        if ($request->type == 'islamicContent' || $request->type == 'quran' || $request->type == 'hadith') {
    // শুধুমাত্র islamicContent হলে ইমেজ চেক করবে, তবে সেটিও অপশনাল (nullable)
    if ($request->type == 'islamicContent') {
        $rules['image'] = 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120';
    }
    
    // পিডিএফ ফিল্ডগুলো সম্পূর্ণ অপশনাল (nullable) করা হলো
    $rules['pdfs'] = 'nullable|array';
    $rules['pdfs.*'] = 'nullable|file|mimes:pdf';
}

        $rules['video_file_temp_path'] = 'nullable|string';
        $rules['audio_file_temp_path'] = 'nullable|string';
        $rules['pdf_temp_path'] = 'nullable|string';
        $rules['document_file_temp_path'] = 'nullable|string';

        $validated = $request->validate($rules);

        // Convert is_featured to boolean if it comes as string "1"/"0" or "true"/"false"
        $validated['is_featured'] = filter_var($request->is_featured, FILTER_VALIDATE_BOOLEAN);

        // image upload
        if ($request->hasFile('image')) {
            if ($religiousContent->image)
                Storage::delete($religiousContent->image);
            $validated['image'] = $request->file('image')->store('islamic-zone/images');
        }

        // video_file
        $videoTempPath = $request->video_file_temp_path;
        if ($request->hasFile('video_file')) {
            if ($religiousContent->video_file && $religiousContent->video_file !== 'processing')
                Storage::delete($religiousContent->video_file);
            $validated['video_file'] = $request->file('video_file')->store('islamic-zone/video');
            $validated['file_size'] = $request->file('video_file')->getSize();
            $videoTempPath = null;
        } elseif ($videoTempPath) {
            if ($religiousContent->video_file && $religiousContent->video_file !== 'processing')
                Storage::delete($religiousContent->video_file);
            $validated['video_file'] = 'processing';
        }

        // audio_file
        $audioTempPath = $request->audio_file_temp_path;
        if ($request->hasFile('audio_file')) {
            if ($religiousContent->audio_file && $religiousContent->audio_file !== 'processing')
                Storage::delete($religiousContent->audio_file);
            $validated['audio_file'] = $request->file('audio_file')->store('islamic-zone/audio');
            $validated['file_size'] = $request->file('audio_file')->getSize();
            $audioTempPath = null;
        } elseif ($audioTempPath) {
            if ($religiousContent->audio_file && $religiousContent->audio_file !== 'processing')
                Storage::delete($religiousContent->audio_file);
            $validated['audio_file'] = 'processing';
        }

        // Document file and pdf backward compatibility are not used anymore for multiple uploads.
        $docTempPath = $request->document_file_temp_path;
        if ($request->hasFile('document_file')) {
            if ($religiousContent->document_file && $religiousContent->document_file !== 'processing')
                Storage::delete($religiousContent->document_file);
            $validated['document_file'] = $request->file('document_file')->store('islamic-zone/ebooks');
            $validated['file_size'] = $request->file('document_file')->getSize();
            $docTempPath = null;
        } elseif ($docTempPath) {
            if ($religiousContent->document_file && $religiousContent->document_file !== 'processing')
                Storage::delete($religiousContent->document_file);
            $validated['document_file'] = 'processing';
        }

        // gallery (replace fully)
        if ($request->hasFile('gallery')) {
            // delete old gallery files
            if ($religiousContent->gallery) {
                foreach (json_decode($religiousContent->gallery) as $g) {
                    Storage::delete($g);
                }
            }

            $galleryPaths = [];
            foreach ($request->file('gallery') as $galleryFile) {
                $galleryPaths[] = $galleryFile->store('islamic-zone/gallery');
            }
            $validated['gallery'] = json_encode($galleryPaths);
        }

        $validated['slug'] = $this->generateUniqueSlug($request->title, $religiousContent->id);
        $validated['lang_id'] = number_format($request->lang_id);

        $religiousContent->update($validated);

        // Handle multiple media
        ServiceClass::syncVideos($request, 'videos', $religiousContent, 'islamic-zone/video', 'islamic_zone_videos');
        ServiceClass::syncPdfs($request, 'pdfs', $religiousContent, 'islamic-zone/ebooks', 'islamic_zone_pdfs');
        ServiceClass::syncAudios($request, 'audios', $religiousContent, 'islamic-zone/audio', 'islamic_zone_audios');

        $hasLargeFiles = $request->filled('video_temp_paths') || $request->filled('audio_temp_paths') || $request->filled('pdf_temp_paths') || 
                         $request->hasFile('videos') || $request->hasFile('audios') || $request->hasFile('pdfs');

        return redirect()->route('admin.islamic-zone.index')
            ->with('success', $hasLargeFiles 
                ? 'Religious content updated. Large files are being processed in the background.' 
                : 'Religious content updated successfully.');
    }


    public function destroy(string $id)
    {
        $religiousContent = IslamicZone::findOrFail($id);

        // delete image
        if ($religiousContent->image) {
            Storage::delete($religiousContent->image);
        }

        // delete document file
        if ($religiousContent->document_file) {
            Storage::delete($religiousContent->document_file);
        }

        // delete audio file
        if ($religiousContent->audio_file) {
            Storage::delete($religiousContent->audio_file);
        }

        // delete video file
        if ($religiousContent->video_file) {
            Storage::delete($religiousContent->video_file);
        }

        // delete gallery array
        if ($religiousContent->gallery) {
            foreach (json_decode($religiousContent->gallery) as $g) {
                Storage::delete($g);
            }
        }

        // Delete multiple files
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

        return to_route('admin.islamic-zone.index')
            ->with('success', 'Religious content deleted successfully.');
    }

    public function download(IslamicZone $religiousContent)
    {
        $filePath = null;

        // Determine which file to download based on type
        switch ($religiousContent->type) {
            case 'ebook':
                $filePath = $religiousContent->document_file;
                break;
            case 'audio':
                $filePath = $religiousContent->audio_file;
                break;
            case 'video':
                $filePath = $religiousContent->video_file;
                break;
        }

        if (!$filePath || !Storage::exists($filePath)) {
            abort(404, 'File not found');
        }

        $religiousContent->increment('downloads');

        return Storage::disk('public')->download($filePath);
    }

    private function generateUniqueSlug($title, $ignoreId = null)
    {
        $slug = Str::slug($title);
        $query = IslamicZone::where('slug', 'like', $slug . '%');

        if ($ignoreId) {
            $query->where('id', '!=', $ignoreId);
        }

        $count = $query->count();

        return $count > 0 ? $slug . '-' . ($count + 1) : $slug;
    }

    private function handleFileUpdates($request, $resource, &$validated)
    {
        $fileTypes = ['image', 'document_file', 'audio_file', 'video_file'];

        foreach ($fileTypes as $fileType) {
            if ($request->hasFile($fileType)) {
                // Delete old file
                if ($resource->$fileType && Storage::disk('public')->exists($resource->$fileType)) {
                    Storage::delete($resource->$fileType);
                }

                // Store new file
                $folder = match ($fileType) {
                    'image' => 'islamic-zone/images',
                    'document_file' => 'islamic-zone/ebooks',
                    'audio_file' => 'islamic-zone/audio',
                    'video_file' => 'islamic-zone/video',
                    default => 'islamic-zone'
                };

                $validated[$fileType] = $request->file($fileType)->store($folder, 'public');

                if ($fileType !== 'image') {
                    $validated['file_size'] = $request->file($fileType)->getSize();
                }
            } else {
                // Keep existing file if not provided
                $validated[$fileType] = $resource->$fileType;
            }
        }

        // Handle gallery updates
        if ($request->hasFile('gallery')) {
            // Delete old gallery files
            if ($resource->gallery) {
                $oldGallery = json_decode($resource->gallery, true);
                foreach ($oldGallery as $oldFile) {
                    if (Storage::disk('public')->exists($oldFile)) {
                        Storage::delete($oldFile);
                    }
                }
            }

            // Store new gallery files
            $galleryPaths = [];
            foreach ($request->file('gallery') as $galleryFile) {
                $galleryPaths[] = $galleryFile->store('islamic-zone/gallery');
            }
            $validated['gallery'] = json_encode($galleryPaths);
        } else {
            // Keep existing gallery if not provided
            $validated['gallery'] = $resource->gallery;
        }
    }

    private function deleteFiles($resource)
    {
        $fileTypes = ['image', 'document_file', 'audio_file', 'video_file'];

        foreach ($fileTypes as $fileType) {
            if ($resource->$fileType && Storage::disk('public')->exists($resource->$fileType)) {
                Storage::delete($resource->$fileType);
            }
        }

        // Delete gallery files
        if ($resource->gallery) {
            $galleryFiles = json_decode($resource->gallery, true);
            foreach ($galleryFiles as $galleryFile) {
                if (Storage::disk('public')->exists($galleryFile)) {
                    Storage::disk('public')->delete($galleryFile);
                }
            }
        }
    }
}
