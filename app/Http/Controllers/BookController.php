<?php

namespace App\Http\Controllers;

use App\Models\Book;
use Inertia\Inertia;
use App\Models\Language;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Intervention\Image\Facades\Image;
use Illuminate\Support\Facades\Storage;

class BookController extends Controller
{
    public function index(Request $request)
    {
        $query = Book::query();

        // Search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', '%' . $search . '%')
                    ->orWhere('description', 'like', '%' . $search . '%');
            });
        }

        // Filter by page count range
        if ($request->has('page_count_min') && $request->page_count_min) {
            $query->where('page_count', '>=', $request->page_count_min);
        }

        if ($request->has('page_count_max') && $request->page_count_max) {
            $query->where('page_count', '<=', $request->page_count_max);
        }

        // Filter by date range
        if ($request->has('date_from') && $request->date_from) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->has('date_to') && $request->date_to) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // Filter by PDF availability
        if ($request->has('has_pdf')) {
            if ($request->has_pdf === 'yes') {
                $query->whereNotNull('original_pdf');
            } elseif ($request->has_pdf === 'no') {
                $query->whereNull('original_pdf');
            }
        }

        // Sorting
        $sortField = $request->get('sort_field', 'created_at');
        $sortDirection = $request->get('sort_direction', 'desc');

        // Validate sort field to prevent SQL injection
        $allowedSortFields = ['id', 'title', 'page_count', 'created_at'];
        if (!in_array($sortField, $allowedSortFields)) {
            $sortField = 'created_at';
        }

        $query->orderBy($sortField, $sortDirection);

        $perPage = $request->get('per_page', 10);
        $books = $query->paginate($perPage)->withQueryString();

        return Inertia::render('Books/Index', [
            'books' => $books,
            'filters' => $request->only([
                'search',
                'page_count_min',
                'page_count_max',
                'date_from',
                'date_to',
                'has_pdf',
                'sort_field',
                'sort_direction',
                'per_page'
            ])
        ]);
    }

    public function create()
    {
        $langs = Language::active()->get();
        return Inertia::render('Books/Create', ['langs' => $langs]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'photo' => 'required|image',
            'pdf_file' => 'required|file|mimes:pdf',
        ]);

        try {
            // Process photo
            $photoPath = $this->processPhoto($request->file('photo'));

            // Process PDF
            $originalPath = $request->file('pdf_file')->store('pdfs/original', 'public');
            $compressedPath = $this->compressPdf($request->file('pdf_file'));
            $pageCount = $this->getPdfPageCount($request->file('pdf_file'));

            // Create book
            $book = Book::create([
                'title' => $request->title,
                'description' => $request->description,
                'photo' => $photoPath,
                'slug' => Str::slug($request->title) . '-' . Str::random(5),
                'lang_id' => $request->lang_id,
                'original_pdf' => $originalPath,
                'compressed_pdf' => $compressedPath,
                'page_count' => $pageCount,
                
            ]);

            return redirect()->route('admin.books.index', $book->id)
                ->with('success', 'Book Create Successfully!');

        } catch (\Exception $e) {
            Log::error('Book creation failed:', ['error' => $e->getMessage()]);
            return back()->with('error', 'Upload failed: ' . $e->getMessage());
        }
    }

    private function processPhoto($photo)
    {
        try {
            // Check if file is valid
            if (!$photo || !$photo->isValid()) {
                throw new \Exception('Invalid photo file');
            }

            $filename = 'book_photo_' . time() . '.webp';
            $path = 'books/photos/' . $filename;

            // Create directory if it doesn't exist
            Storage::disk('public')->makeDirectory('books/photos');

            // Process image
            $image = Image::make($photo->getRealPath());

            // Convert to WebP with compression
            $image->encode('webp', 80);

            // Resize maintaining aspect ratio
            $image->resize(600, 800, function ($constraint) {
                $constraint->aspectRatio();
                $constraint->upsize();
            });

            // Save to storage
            Storage::disk('public')->put($path, (string) $image);

            // Verify file was saved
            if (!Storage::disk('public')->exists($path)) {
                throw new \Exception('Failed to save photo to storage');
            }

            return $path;

        } catch (\Exception $e) {
            Log::error('Photo processing error:', ['error' => $e->getMessage()]);
            throw new \Exception('Image processing failed: ' . $e->getMessage());
        }
    }

    private function compressPdf($pdfFile)
    {
        try {
            // Check if file is valid
            if (!$pdfFile || !$pdfFile->isValid()) {
                throw new \Exception('Invalid PDF file');
            }

            $filename = 'compressed_' . time() . '.pdf';
            $path = 'pdfs/compressed/' . $filename;

            // Create directory if it doesn't exist
            Storage::disk('public')->makeDirectory('pdfs/compressed');

            // Store the file
            $fileContent = file_get_contents($pdfFile->getRealPath());
            Storage::disk('public')->put($path, $fileContent);

            // Verify file was saved
            if (!Storage::disk('public')->exists($path)) {
                throw new \Exception('Failed to save compressed PDF to storage');
            }

            return $path;

        } catch (\Exception $e) {
            Log::error('PDF compression error:', ['error' => $e->getMessage()]);
            throw new \Exception('PDF compression failed: ' . $e->getMessage());
        }
    }

    private function getPdfPageCount($pdfFile)
    {
        try {
            $filePath = $pdfFile->getRealPath();

            // Method 1: Using pdfinfo command
            if (function_exists('shell_exec')) {
                $command = "pdfinfo " . escapeshellarg($filePath) . " 2>&1";
                $output = shell_exec($command);

                if (preg_match('/Pages:\s*(\d+)/i', $output, $matches)) {
                    return (int) $matches[1];
                }
            }

            // Method 2: Regex fallback
            $content = file_get_contents($filePath);
            preg_match_all("/\/Type\s*\/Page[^s]/", $content, $matches);
            $pageCount = count($matches[0]);

            return $pageCount > 0 ? $pageCount : 1;

        } catch (\Exception $e) {
            Log::error('PDF Page Count Error: ' . $e->getMessage());
            return 1;
        }
    }

    public function show($id)
    {
        $book = Book::findOrFail($id);

        return Inertia::render('Books/Show', [
            'book' => [
                'id' => $book->id,
                'title' => $book->title,
                'description' => $book->description,
                'photo' => $book->photo,
                'photo_url' => $book->photo ? Storage::disk('public')->url($book->photo) : null,
                'original_pdf' => $book->original_pdf,
                'original_pdf_url' => $book->original_pdf ? Storage::disk('public')->url($book->original_pdf) : null,
                'compressed_pdf' => $book->compressed_pdf,
                'compressed_pdf_url' => $book->compressed_pdf ? Storage::disk('public')->url($book->compressed_pdf) : null,
                'page_count' => $book->page_count,
                'created_at' => $book->created_at->format('Y-m-d H:i:s'),
            ],
        ]);
    }

    public function edit($id)
    {
        $book = Book::with('seo')->findOrFail($id);

        $bookData = [
            'id' => $book->id,
            'title' => $book->title,
            'description' => $book->description,
            'photo' => $book->photo,
            'photo_url' => Storage::disk('public')->url($book->photo),
            'original_pdf' => $book->original_pdf,
            'compressed_pdf' => $book->compressed_pdf,
            'current_pdf_name' => basename($book->original_pdf),
            'page_count' => $book->page_count,
            'created_at' => $book->created_at,
            'updated_at' => $book->updated_at,
        ];

        $seoData = null;
        if ($book->seo) {
            $seoData = [
                'id' => $book->seo->id,
                'meta_title' => $book->seo->meta_title,
                'meta_description' => $book->seo->meta_description,
                'meta_keywords' => $book->seo->meta_keywords,
                'meta_robots' => $book->seo->meta_robots,
                'og_title' => $book->seo->og_title,
                'og_description' => $book->seo->og_description,
                'og_image' => $book->seo->og_image,
                'og_image_url' => $book->seo->og_image ? Storage::disk('public')->url($book->seo->og_image) : null,
                'og_type' => $book->seo->og_type,
                'og_url' => $book->seo->og_url,
                'og_site_name' => $book->seo->og_site_name,
                'twitter_title' => $book->seo->twitter_title,
                'twitter_description' => $book->seo->twitter_description,
                'twitter_image' => $book->seo->twitter_image,
                'twitter_image_url' => $book->seo->twitter_image ? Storage::disk('public')->url($book->seo->twitter_image) : null,
                'twitter_card' => $book->seo->twitter_card,
                'twitter_site' => $book->seo->twitter_site,
                'twitter_creator' => $book->seo->twitter_creator,
                'twitter_url' => $book->seo->twitter_url,
                'canonical_url' => $book->seo->canonical_url,
                'structured_data' => $book->seo->structured_data,
                'focus_keywords' => $book->seo->focus_keywords,
            ];
        }

        $langs = Language::active()->get();
        return Inertia::render('Books/Edit', [
            'book' => $bookData,
            'seo' => $seoData,
            'langs' => $langs,
        ]);
    }

    public function update(Request $request, $id)
    {
        $book = Book::with('seo')->findOrFail($id);

        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'page_count' => 'required|integer|min:1',

            // SEO validation
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:500',
            'meta_keywords' => 'nullable|array',
            'meta_robots' => 'nullable|string',
            'og_title' => 'nullable|string|max:255',
            'og_description' => 'nullable|string|max:500',
            'og_type' => 'nullable|string',
            'og_url' => 'nullable|url',
            'og_site_name' => 'nullable|string|max:255',
            'twitter_title' => 'nullable|string|max:255',
            'twitter_description' => 'nullable|string|max:500',
            'twitter_card' => 'nullable|string',
            'twitter_site' => 'nullable|string|max:100',
            'twitter_creator' => 'nullable|string|max:100',
            'twitter_url' => 'nullable|url',
            'canonical_url' => 'nullable|url',
            'structured_data' => 'nullable|string',
            'focus_keywords' => 'nullable|array',
        ]);

        try {
            DB::beginTransaction();

            // Update photo
            if ($request->hasFile('photo')) {
                // Delete old photo
                if ($book->photo && Storage::disk('public')->exists($book->photo)) {
                    Storage::disk('public')->delete($book->photo);
                }
                $book->photo = $this->processPhoto($request->file('photo'));
            }

            // Update original PDF
            if ($request->hasFile('original_pdf')) {
                // Delete old PDFs
                if ($book->original_pdf && Storage::disk('public')->exists($book->original_pdf)) {
                    Storage::disk('public')->delete($book->original_pdf);
                }
                $book->original_pdf = $request->file('original_pdf')->store('pdfs/original', 'public');

                // Update page count when PDF changes
                $book->page_count = $this->getPdfPageCount($request->file('original_pdf'));
            }

            // Update compressed PDF
            if ($request->hasFile('compressed_pdf')) {
                if ($book->compressed_pdf && Storage::disk('public')->exists($book->compressed_pdf)) {
                    Storage::disk('public')->delete($book->compressed_pdf);
                }
                $book->compressed_pdf = $request->file('compressed_pdf')->store('pdfs/compressed', 'public');
            }

            // Update book basic info
            $book->title = $request->title;
            $book->lang_id = $request->lang_id;
            $book->description = $request->description;

            // Only update page count if no new PDF was uploaded
            if (!$request->hasFile('original_pdf')) {
                $book->page_count = $request->page_count;
            }

            $book->save();

            // Update or create SEO data
            $seoData = [
                'meta_title' => $request->meta_title,
                'meta_description' => $request->meta_description,
                'meta_keywords' => $request->meta_keywords ? json_encode($request->meta_keywords) : json_encode([]),
                'meta_robots' => $request->meta_robots ?? 'index, follow',
                'og_title' => $request->og_title,
                'og_description' => $request->og_description,
                'og_type' => $request->og_type ?? 'website',
                'og_url' => $request->og_url,
                'og_site_name' => $request->og_site_name ?? config('app.name'),
                'twitter_title' => $request->twitter_title,
                'twitter_description' => $request->twitter_description,
                'twitter_card' => $request->twitter_card ?? 'summary_large_image',
                'twitter_site' => $request->twitter_site,
                'twitter_creator' => $request->twitter_creator,
                'twitter_url' => $request->twitter_url,
                'canonical_url' => $request->canonical_url,
                'structured_data' => $request->structured_data,
                'focus_keywords' => $request->focus_keywords ? json_encode($request->focus_keywords) : json_encode([]),
            ];

            // Handle SEO image uploads
            if ($request->hasFile('og_image')) {
                // Delete old OG image
                if ($book->seo && $book->seo->og_image && Storage::disk('public')->exists($book->seo->og_image)) {
                    Storage::disk('public')->delete($book->seo->og_image);
                }
                $seoData['og_image'] = $this->processSeoImage($request->file('og_image'), 'og_images');
            }

            if ($request->hasFile('twitter_image')) {
                // Delete old Twitter image
                if ($book->seo && $book->seo->twitter_image && Storage::disk('public')->exists($book->seo->twitter_image)) {
                    Storage::disk('public')->delete($book->seo->twitter_image);
                }
                $seoData['twitter_image'] = $this->processSeoImage($request->file('twitter_image'), 'twitter_images');
            }

            // Update or create SEO record
            if ($book->seo) {
                $book->seo->update($seoData);
            } else {
                $book->seo()->create($seoData);
            }

            DB::commit();

            return redirect()->route('admin.books.index', $book->id)
                ->with('success', 'Book updated successfully!');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Update failed: ' . $e->getMessage());
        }
    }

    public function destroy($id)
    {
        $book = Book::findOrFail($id);

        try {
            $filesToDelete = [
                $book->photo,
                $book->original_pdf,
                $book->compressed_pdf
            ];

            foreach ($filesToDelete as $file) {
                if ($file && Storage::disk('public')->exists($file)) {
                    Storage::disk('public')->delete($file);
                }
            }

            $book->delete();

            return redirect()->route('admin.books.index')
                ->with('success', 'Book deleted successfully!');

        } catch (\Exception $e) {
            return back()->with('error', 'Delete failed: ' . $e->getMessage());
        }
    }
}