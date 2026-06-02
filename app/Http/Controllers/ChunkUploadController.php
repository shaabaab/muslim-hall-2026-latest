<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class ChunkUploadController extends Controller
{
    /**
     * Handle incoming chunked file uploads.
     * Expects: chunk (file), chunkIndex, totalChunks, identifier, fileName
     *
     * Supports files up to 5 GB.
     * Each chunk is typically 5 MB from the frontend.
     * Uses streaming I/O (1 MB buffer) to avoid memory exhaustion.
     */
    public function upload(Request $request)
    {
        try {
            $request->validate([
                'chunk'       => 'required|file',
                'chunkIndex'  => 'required|integer|min:0',
                'totalChunks' => 'required|integer|min:1',
                'identifier'  => 'required|string|max:200',
                'fileName'    => 'required|string|max:500',
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'error'   => $e->getMessage(),
            ], 422);
        }

        // Allow unlimited execution time for very large files
        set_time_limit(0);
        // Increase memory limit for chunk processing
        ini_set('memory_limit', '256M');

        try {
            $chunk       = $request->file('chunk');
            $chunkIndex  = (int) $request->input('chunkIndex');
            $totalChunks = (int) $request->input('totalChunks');
            $identifier  = $request->input('identifier');
            $fileName    = $request->input('fileName');

            // Sanitize file name — only allow safe characters
            $safeFileName = preg_replace('/[^a-zA-Z0-9_.-]/', '_', $fileName);
            $tempDir      = storage_path('app/temp');

            // Ensure temp directory exists and is writable
            if (!File::exists($tempDir)) {
                if (!File::makeDirectory($tempDir, 0775, true)) {
                    throw new \Exception("Could not create temp directory at {$tempDir}");
                }
            }

            if (!is_writable($tempDir)) {
                throw new \Exception("Temp directory is not writable: {$tempDir}");
            }

            $tempFilePath  = $tempDir . DIRECTORY_SEPARATOR . $identifier . '.part';
            $finalFilePath = $tempDir . DIRECTORY_SEPARATOR . $identifier . '_' . $safeFileName;

            // ── Out-of-order / stale detection ──────────────────────────────
            // If this is chunk 0 but a .part file already exists, it's a
            // leftover from a previous failed upload — delete it and start fresh.
            if ($chunkIndex === 0 && File::exists($tempFilePath)) {
                File::delete($tempFilePath);
                Log::info("ChunkUpload: deleted stale part file for identifier={$identifier}");
            }

            // ── Stream-append chunk to the .part file ────────────────────────
            // Use a 1 MB buffer for efficient I/O on large chunks.
            $in = fopen($chunk->getRealPath(), 'rb');
            if ($in === false) {
                throw new \Exception("Could not open input chunk stream");
            }

            $out = fopen($tempFilePath, 'ab');
            if ($out === false) {
                fclose($in);
                throw new \Exception("Could not open output temp stream at {$tempFilePath}");
            }

            $bufferSize = 1024 * 1024; // 1 MB buffer
            while (!feof($in)) {
                $buff = fread($in, $bufferSize);
                if ($buff !== false && $buff !== '') {
                    fwrite($out, $buff);
                }
            }

            fclose($in);
            fclose($out);

            // ── Last chunk: finalise the assembled file ──────────────────────
            if ($chunkIndex === $totalChunks - 1) {
                File::move($tempFilePath, $finalFilePath);

                Log::info("ChunkUpload: assembly complete for {$safeFileName} ({$totalChunks} chunks)");

                return response()->json([
                    'success'   => true,
                    'done'      => true,
                    'temp_path' => 'temp/' . basename($finalFilePath),
                ]);
            }

            return response()->json([
                'success' => true,
                'done'    => false,
                'message' => "Chunk {$chunkIndex} of {$totalChunks} uploaded successfully",
            ]);

        } catch (\Exception $e) {
            Log::error('Chunk Upload Error: ' . $e->getMessage(), [
                'identifier'  => $request->input('identifier'),
                'chunkIndex'  => $request->input('chunkIndex'),
                'totalChunks' => $request->input('totalChunks'),
            ]);
            return response()->json([
                'success' => false,
                'error'   => 'Failed to upload chunk: ' . $e->getMessage(),
            ], 500);
        }
    }
}
