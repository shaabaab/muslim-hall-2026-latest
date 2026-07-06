<?php

namespace App\Services;

use App\Models\Contest;
use App\Models\Entry;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use App\Services\ServiceClass;
use Illuminate\Http\Request;

class ServiceClassOld
{

    // upload file function
    static function uploadFile($file, $path)
    {
        return ServiceClass::uploadFile($file, $path);
    }


    //update file function
    static function updateFile($file, $path, $oldFilePath)
    {
        // Delete old file
        self::deleteFile($oldFilePath);
        // Upload new file
        return self::uploadFile($file, $path);
    }



    // Upload multiple images function

    public static function uploadMultipleImages($data, string $inputName, $model, string $relation, string $directory, int $maxFiles)
    {
        $files = [];

        if ($data instanceof \Illuminate\Http\Request && $data->hasFile($inputName)) {
            $files = $data->file($inputName);
        } elseif (is_array($data) && isset($data[$inputName])) {
            $files = $data[$inputName];
        }

        if (empty($files)) {
            return true;
        }

        if (!is_array($files)) {
            $files = [$files];
        }

        if (count($files) > $maxFiles) {
            return "You can upload a maximum of {$maxFiles} images.";
        }

        foreach ($files as $image) {
            $path = ServiceClass::uploadFile($image, $directory);
            $model->$relation()->create([
                'image' => $path
            ]);
        }

        return true;
    }


    /**
     * Replace old file with a new one (for video/pdf).
     */

    public static function updateMultipleImages(Request $request, string $inputName, $model, string $relation, string $directory,  int $maxFiles)
    {
        if (!$request->hasFile($inputName)) {
            return true;
        }

        $images = $request->file($inputName);

        if (count($images) > $maxFiles) {
            throw new \Exception("You can upload a maximum of {$maxFiles} images.");
        }

        foreach ($model->$relation as $oldImage) {
            ServiceClass::deleteFile($oldImage->image);
        }
        $model->$relation()->delete();

        foreach ($images as $image) {
            $path = ServiceClass::uploadFile($image, $directory);
            $model->$relation()->create(['image' => $path]);
        }

        return true;
    }


    public static function syncFeaturedImages(
        Request $request,
        string $inputName,
        $model,
        string $relation,
        string $directory,
        int $maxFiles
    ) {
        $existingIds = $request->input('existing_featured_images', []);
        $removeIds   = $request->input('remove_featured_images', []);

        /* ---------------------------------
     | 1. Remove explicitly removed images
     ---------------------------------*/
        if (!empty($removeIds)) {
            $imagesToRemove = $model->$relation()->whereIn('id', $removeIds)->get();

            foreach ($imagesToRemove as $image) {
                ServiceClass::deleteFile($image->image);
                $image->delete();
            }
        }

        /* ---------------------------------
     | 2. Safety cleanup (keep only existing)
     |    Prevents stale DB records
     ---------------------------------*/
        foreach ($model->$relation as $oldImage) {
            if (
                !in_array($oldImage->id, $existingIds) &&
                !in_array($oldImage->id, $removeIds)
            ) {
                // do nothing (extra safety)
                continue;
            }
        }

        /* ---------------------------------
     | 3. Add new images
     ---------------------------------*/
        if ($request->hasFile($inputName)) {
            $newImages = $request->file($inputName);

            $currentCount = count($existingIds);
            $totalCount   = $currentCount + count($newImages);

            if ($totalCount > $maxFiles) {
                throw new \Exception("Maximum {$maxFiles} featured images allowed.");
            }

            foreach ($newImages as $image) {
                $path = ServiceClass::uploadFile($image, $directory);

                $model->$relation()->create([
                    'image' => $path,
                ]);
            }
        }

        return true;
    }



    //delete file function
    public static function deleteFile(?string $filePath, string $disk = 'public'): void
    {
        ServiceClass::deleteFile($filePath);
    }

    /**
     * Upload file and delete old one if exists.
     *
     * @param  UploadedFile|null  $file
     * @param  string  $folder
     * @param  string|null  $oldFile
     * @return string|null
     */

    static function uploadUpdateFile($file, string $folder, ?string $oldFile = null): ?string
    {
        if (!$file) {
            return $oldFile;
        }

        if ($oldFile) {
            ServiceClass::deleteFile($oldFile);
        }

        return ServiceClass::uploadFile($file, $folder);
    }



    /**
     * Delete multiple related images from storage and database.
     */

    public static function deleteMultipleImages($model, string $relationName, string $disk = 'public'): void
    {
        if ($model->$relationName && $model->$relationName->count() > 0) {
            foreach ($model->$relationName as $item) {
                if (!empty($item->image)) {
                    ServiceClass::deleteFile($item->image);
                }
            }
            $model->$relationName()->delete(); // Remove DB records
        }
    }
}
