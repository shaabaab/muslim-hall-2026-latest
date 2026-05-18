<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Notifications\FileProcessingCompleteNotification;
use App\Models\User;

class ProcessFileUpload implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * Timeout in seconds (1 hour for large files up to 5GB).
     */
    public int $timeout = 3600;

    /**
     * Constructor — receives all needed info to upload and store the file.
     *
     * @param string $moduleName   The DB table name (e.g. 'posts', 'books', 'advertisements')
     * @param int    $recordId     The ID of the record to update
     * @param string $columnName   The column to update (e.g. 'video', 'pdf', 'audio')
     * @param string $tempFilePath The local temp file path (relative to storage/app/)
     * @param string $folderPath   The S3 destination folder (e.g. 'posts/videos')
     */
    public function __construct(
        public string $moduleName,
        public int    $recordId,
        public string $columnName,
        public string $tempFilePath,
        public string $folderPath,
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        // Full path to the temp file on local disk
        $fullLocalPath = storage_path('app/' . $this->tempFilePath);

        // Check if temp file still exists
        if (!file_exists($fullLocalPath)) {
            Log::warning("ProcessFileUpload: Temp file not found — skipping.", [
                'module'  => $this->moduleName,
                'record'  => $this->recordId,
                'column'  => $this->columnName,
                'tmpPath' => $this->tempFilePath,
            ]);
            return;
        }

        try {
            // Build S3 file name: timestamp + unique suffix + original extension
            $extension = pathinfo($fullLocalPath, PATHINFO_EXTENSION);
            $fileName  = time() . '_' . Str::uuid() . '.' . $extension;
            $s3Path    = $this->folderPath . '/' . $fileName;

            Log::info("ProcessFileUpload: Starting upload to S3.", [
                'module' => $this->moduleName,
                'record' => $this->recordId,
                'column' => $this->columnName,
                's3Path' => $s3Path,
            ]);

            // Upload file stream to S3 (handles large files efficiently)
            // Note: 'public' ACL removed — newer S3 buckets have ACL disabled by default.
            // Use 'visibility' => 'public' option instead via Flysystem config.
            $stream = fopen($fullLocalPath, 'r');
            Storage::disk('s3')->writeStream($s3Path, $stream);

            if (is_resource($stream)) {
                fclose($stream);
            }

            // Update the record in the correct module table
            DB::table($this->moduleName)
                ->where('id', $this->recordId)
                ->update([$this->columnName => $s3Path]);

            Log::info("ProcessFileUpload: Upload complete and DB updated.", [
                'module' => $this->moduleName,
                'record' => $this->recordId,
                'column' => $this->columnName,
                's3Path' => $s3Path,
            ]);

            // Notify the post creator that their file is done processing
            if ($this->moduleName === 'posts' || $this->moduleName === 'post_videos' || $this->moduleName === 'post_pdfs' || $this->moduleName === 'post_audios') {
                try {
                    // Determine the post ID
                    $postId = null;
                    $postTitle = 'Your Post';

                    if ($this->moduleName === 'posts') {
                        $postId = $this->recordId;
                    } else {
                        // For post_videos, post_pdfs, post_audios — look up the post_id
                        $row = DB::table($this->moduleName)->where('id', $this->recordId)->first();
                        $postId = $row?->post_id ?? null;
                    }

                    if ($postId) {
                        $post = DB::table('posts')->where('id', $postId)->first();
                        $postTitle = $post?->title ?? 'Your Post';
                        $createdBy = $post?->created_by ?? null;

                        if ($createdBy) {
                            $user = User::find($createdBy);
                            if ($user) {
                                $user->notify(new FileProcessingCompleteNotification(
                                    $postTitle,
                                    $postId,
                                    $this->columnName
                                ));
                            }
                        }
                    }
                } catch (\Throwable $notifyEx) {
                    Log::warning('ProcessFileUpload: Could not send completion notification.', [
                        'error' => $notifyEx->getMessage(),
                    ]);
                }
            }
        } catch (\Throwable $e) {
            Log::error("ProcessFileUpload: Upload failed.", [
                'module'  => $this->moduleName,
                'record'  => $this->recordId,
                'column'  => $this->columnName,
                'error'   => $e->getMessage(),
            ]);

            // Re-throw so the job is marked as failed and retried
            throw $e;
        } finally {
            // Always delete the temp file, success or fail
            if (file_exists($fullLocalPath)) {
                unlink($fullLocalPath);
            }
        }
    }

    /**
     * Handle a job failure after all retries are exhausted.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error("ProcessFileUpload: Job permanently failed after all retries.", [
            'module' => $this->moduleName,
            'record' => $this->recordId,
            'column' => $this->columnName,
            'error'  => $exception->getMessage(),
        ]);

        // Mark column as null so the UI doesn't show 'processing' forever
        DB::table($this->moduleName)
            ->where('id', $this->recordId)
            ->update([$this->columnName => null]);
    }
}
