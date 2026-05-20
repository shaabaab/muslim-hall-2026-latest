<?php

namespace App\Services;

use App\Jobs\ProcessFileUpload;
use App\Models\OptimizationSetting;
use Intervention\Image\Facades\Image;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ServiceClass
{
    /**
     * Storage disk
     */
    protected static ?string $disk = null;

    /**
     * Get the storage disk
     */
    protected static function getDisk(): string
    {
        if (self::$disk === null) {
            self::$disk = config('filesystems.default', 'public');
        }
        return self::$disk;
    }


    /* =====================================================
     |  Single File Upload
     ===================================================== */
    public static function uploadFile(UploadedFile $file, string $path, ?string $disk = null)
    {
        logger('Starting file upload: ' . $file->getClientOriginalName() . ' to path: ' . $path);
        try {
            $targetDisk = $disk ?? self::getDisk();
            $fileName = Str::uuid() . '.' . $file->getClientOriginalExtension();
            $mimeType = $file->getMimeType();
            $optimization = OptimizationSetting::first();

            // Handle Image Optimization
            if ($optimization && $optimization->image_optimization_enabled && str_starts_with($mimeType, 'image/')) {
                $image = Image::make($file);

                // Encode based on set quality (only works for JPG/PNG/WebP/etc. supported by Intervention)
                $optimizedData = $image->encode($file->getClientOriginalExtension(), $optimization->image_quality);

                $storedPath = $path . '/' . $fileName;
                Storage::disk($targetDisk)->put($storedPath, $optimizedData);

                logger('Image optimized and uploaded: ' . $storedPath . ' at quality: ' . $optimization->image_quality);
                return $storedPath;
            }

            // Default upload for other file types or if optimization is disabled
            $storedPath = Storage::disk($targetDisk)->putFileAs($path, $file, $fileName);

            logger('File uploaded: ' . $storedPath);

            return $storedPath;
        } catch (\Throwable $e) {
            logger()->error('Upload Error: ' . $e->getMessage(), [
                'exception' => $e,
                'file' => $file->getClientOriginalName(),
                'path' => $path
            ]);
            return null;
        }
    }


    /* =====================================================
     |  Large File Upload — saves temp + dispatches Queue Job
     ===================================================== */
    /**
     * Save a large file (video/audio/pdf) to a local temp folder,
     * then dispatch a background queue job to upload it to S3.
     *
     * Works for ANY module — just pass the table name, column, and record ID.
     *
     * Usage example:
     *   ServiceClass::uploadLargeFile(
     *       $request->file('video'),
     *       'posts/videos',
     *       'posts',        // DB table name
     *       'video',        // column to update after upload
     *       $post->id
     *   );
     *
     * The method returns 'processing' immediately.
     * The queue job saves the real S3 path to the DB when done.
     *
     * @param  UploadedFile $file        The uploaded file from the request
     * @param  string       $folderPath  S3 destination folder (e.g. 'posts/videos')
     * @param  string       $moduleName  DB table name (e.g. 'posts', 'books')
     * @param  string       $columnName  Column to update (e.g. 'video', 'pdf')
     * @param  int          $recordId    ID of the record
     * @return string                    Returns 'processing' as a placeholder
     */
    public static function uploadLargeFile(
        UploadedFile $file,
        string $folderPath,
        string $moduleName,
        string $columnName,
        int $recordId
    ): string {
        // Use move() instead of store() for large files! 
        // store() uses a slow byte-by-byte stream copy, causing the progress bar to hang at 100%.
        // move() uses OS-level move_uploaded_file, which is instantly fast.
        $fileName = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $file->move(storage_path('app/temp'), $fileName);
        $tempPath = 'temp/' . $fileName;

        // Dispatch the background job to handle S3 upload
        ProcessFileUpload::dispatch(
            $moduleName,
            $recordId,
            $columnName,
            $tempPath,
            $folderPath
        );

        logger("uploadLargeFile dispatched job", [
            'module'   => $moduleName,
            'record'   => $recordId,
            'column'   => $columnName,
            'tempPath' => $tempPath,
        ]);

        // Return a placeholder — the real S3 path will be set by the job
        return 'processing';
    }


    /* =====================================================
     |  Dispatch Job for Pre-Uploaded Temp File (Chunked)
     ===================================================== */
    /**
     * Dispatch a background queue job to upload a pre-existing temp file to S3.
     * Used mainly for chunked uploads where the file is already assembled.
     */
    public static function dispatchLargeFileJob(
        string $tempPath,
        string $folderPath,
        string $moduleName,
        string $columnName,
        int $recordId
    ): string {
        ProcessFileUpload::dispatch(
            $moduleName,
            $recordId,
            $columnName,
            $tempPath,
            $folderPath
        );

        logger("dispatchLargeFileJob dispatched job", [
            'module'   => $moduleName,
            'record'   => $recordId,
            'column'   => $columnName,
            'tempPath' => $tempPath,
        ]);

        return 'processing';
    }


    /* =====================================================
     |  Check if a file column is still being processed
     ===================================================== */
    /**
     * Returns true if the column value is the 'processing' placeholder.
     * Useful in controllers/views to skip showing a file preview.
     *
     * @param  mixed $value  The column value from the DB
     * @return bool
     */
    public static function isProcessing(mixed $value): bool
    {
        return $value === 'processing';
    }


    /* =====================================================
     |  Update File (Delete Old + Upload New)
     ===================================================== */
    public static function updateFile(UploadedFile $file, string $path, ?string $oldFilePath = null, ?string $disk = null): ?string
    {
        if ($oldFilePath) {
            self::deleteFile($oldFilePath, $disk);
        }

        return self::uploadFile($file, $path, $disk);
    }


    /* =====================================================
     |  Upload Multiple Images
     ===================================================== */
    public static function uploadMultipleImages(
        Request $request,
        string $inputName,
        $model,
        string $relation,
        string $directory,
        ?int $maxFiles = null,
        ?string $disk = null
    ): bool|string {
        if (!$request->hasFile($inputName)) {
            return true;
        }

        $files = $request->file($inputName);

        if (!is_array($files)) {
            $files = [$files];
        }

        if ($maxFiles !== null && count($files) > $maxFiles) {
            return "Maximum {$maxFiles} images allowed.";
        }

        foreach ($files as $file) {
            $path = self::uploadFile($file, $directory, $disk);

            if ($path) {
                $model->$relation()->create(['image' => $path]);
            }
        }

        return true;
    }


    /* =====================================================
     |  Update Multiple Images (Replace All)
     ===================================================== */
    public static function updateMultipleImages(
        Request $request,
        string $inputName,
        $model,
        string $relation,
        string $directory,
        ?int $maxFiles = null,
        ?string $disk = null
    ): bool {
        if (!$request->hasFile($inputName)) {
            return true;
        }

        $images = $request->file($inputName);

        if ($maxFiles !== null && count($images) > $maxFiles) {
            throw new \Exception("Maximum {$maxFiles} images allowed.");
        }

        // Delete old images from S3 and DB
        self::deleteMultipleImages($model, $relation, $disk);

        // Upload new images
        foreach ($images as $file) {
            $path = self::uploadFile($file, $directory, $disk);
            if ($path) {
                $model->$relation()->create(['image' => $path]);
            }
        }

        return true;
    }


    /* =====================================================
     |  Sync Featured Images (Add / Remove / Keep)
     ===================================================== */
    public static function syncFeaturedImages(
        Request $request,
        string $inputName,
        $model,
        string $relation,
        string $directory,
        ?int $maxFiles = null,
        ?string $disk = null
    ): bool {
        $existingIds = $request->input('existing_featured_images', []);
        $removeIds   = $request->input('remove_featured_images', []);

        // Remove explicitly deleted images
        if (!empty($removeIds)) {
            $images = $model->$relation()->whereIn('id', $removeIds)->get();

            foreach ($images as $image) {
                if ($image->image) {
                    Storage::disk($disk ?? self::getDisk())->delete($image->image);
                }
                $image->delete();
            }
        }

        // Upload new images
        if ($request->hasFile($inputName)) {
            $newFiles = $request->file($inputName);
            $currentCount = count($existingIds);
            $totalCount = $currentCount + count($newFiles);

            if ($maxFiles !== null && $totalCount > $maxFiles) {
                throw new \Exception("Maximum {$maxFiles} images allowed.");
            }

            foreach ($newFiles as $file) {
                $path = self::uploadFile($file, $directory, $disk);
                if ($path) {
                    $model->$relation()->create(['image' => $path]);
                }
            }
        }

        return true;
    }

    public static function syncVideos(
        Request $request,
        string $inputName,
        $model,
        string $directory,
        string $tableName = 'post_videos'
    ): bool {
        $removeIds = $request->input('remove_videos', []);

        if (!empty($removeIds)) {
            $videos = $model->videos()->whereIn('id', $removeIds)->get();
            foreach ($videos as $video) {
                if ($video->video && $video->video !== 'processing') {
                    self::deleteFile($video->video);
                }
                $video->delete();
            }
        }

        if ($request->hasFile($inputName)) {
            $files = $request->file($inputName);
            if (!is_array($files)) $files = [$files];

            foreach ($files as $file) {
                $video = $model->videos()->create(['video' => 'processing']);
                self::uploadLargeFile($file, $directory, $tableName, 'video', $video->id);
            }
        }

        // Handle temp paths (chunked upload)
        if ($request->filled('video_temp_paths')) {
            $tempPaths = $request->input('video_temp_paths');
            if (!is_array($tempPaths)) $tempPaths = [$tempPaths];

            foreach ($tempPaths as $tempPath) {
                $video = $model->videos()->create(['video' => 'processing']);
                self::dispatchLargeFileJob($tempPath, $directory, $tableName, 'video', $video->id);
            }
        }

        return true;
    }

    public static function syncPdfs(
        Request $request,
        string $inputName,
        $model,
        string $directory,
        string $tableName = 'post_pdfs'
    ): bool {
        $removeIds = $request->input('remove_pdfs', []);

        if (!empty($removeIds)) {
            $pdfs = $model->pdfs()->whereIn('id', $removeIds)->get();
            foreach ($pdfs as $pdf) {
                if ($pdf->pdf && $pdf->pdf !== 'processing') {
                    self::deleteFile($pdf->pdf);
                }
                $pdf->delete();
            }
        }

        if ($request->hasFile($inputName)) {
            $files = $request->file($inputName);
            if (!is_array($files)) $files = [$files];

            foreach ($files as $file) {
                $pdf = $model->pdfs()->create(['pdf' => 'processing']);
                self::uploadLargeFile($file, $directory, $tableName, 'pdf', $pdf->id);
            }
        }

        // Handle temp paths (chunked upload)
        if ($request->filled('pdf_temp_paths')) {
            $tempPaths = $request->input('pdf_temp_paths');
            if (!is_array($tempPaths)) $tempPaths = [$tempPaths];

            foreach ($tempPaths as $tempPath) {
                $pdf = $model->pdfs()->create(['pdf' => 'processing']);
                self::dispatchLargeFileJob($tempPath, $directory, $tableName, 'pdf', $pdf->id);
            }
        }

        return true;
    }
    public static function syncAudios(
        Request $request,
        string $inputName,
        $model,
        string $directory,
        string $tableName = 'post_audios'
    ): bool {
        $removeIds = $request->input('remove_audios', []);

        if (!empty($removeIds)) {
            $audios = $model->audios()->whereIn('id', $removeIds)->get();
            foreach ($audios as $audio) {
                if ($audio->audio && $audio->audio !== 'processing') {
                    self::deleteFile($audio->audio);
                }
                $audio->delete();
            }
        }

        if ($request->hasFile($inputName)) {
            $files = $request->file($inputName);
            if (!is_array($files)) $files = [$files];

            foreach ($files as $file) {
                $audio = $model->audios()->create(['audio' => 'processing']);
                self::uploadLargeFile($file, $directory, $tableName, 'audio', $audio->id);
            }
        }

        // Handle temp paths (chunked upload)
        if ($request->filled('audio_temp_paths')) {
            $tempPaths = $request->input('audio_temp_paths');
            if (!is_array($tempPaths)) $tempPaths = [$tempPaths];

            foreach ($tempPaths as $tempPath) {
                $audio = $model->audios()->create(['audio' => 'processing']);
                self::dispatchLargeFileJob($tempPath, $directory, $tableName, 'audio', $audio->id);
            }
        }

        return true;
    }

    /* =====================================================
     |  Delete Single File
     ===================================================== */
    public static function deleteFile(?string $filePath, ?string $disk = null): void
    {
        $targetDisk = $disk ?? self::getDisk();
        if ($filePath && Storage::disk($targetDisk)->exists($filePath)) {
            Storage::disk($targetDisk)->delete($filePath);
        }
    }


    /* =====================================================
     |  Upload or Keep Old File
     ===================================================== */
    public static function uploadUpdateFile(?UploadedFile $file, string $folder, ?string $oldFile = null): ?string
    {
        if (!$file) {
            return $oldFile;
        }

        if ($oldFile) {
            self::deleteFile($oldFile);
        }

        return self::uploadFile($file, $folder);
    }


    /* =====================================================
     |  Delete Multiple Related Images
     ===================================================== */
    public static function deleteMultipleImages($model, string $relationName, ?string $disk = null): void
    {
        if (!$model->$relationName) {
            return;
        }

        foreach ($model->$relationName as $item) {
            if ($item->image) {
                Storage::disk($disk ?? self::getDisk())->delete($item->image);
            }
        }

        $model->$relationName()->delete();
    }


    /* =====================================================
     |  Get File URL (Helper)
     ===================================================== */
    public static function getFileUrl(?string $path): ?string
    {
        if (!$path) {
            return null;
        }

        return Storage::disk(self::getDisk())->url($path);
    }
}
