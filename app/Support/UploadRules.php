<?php

namespace App\Support;

class UploadRules
{
    public const IMAGE_MIMES = 'jpg,jpeg,png,webp,gif,svg,bmp,avif';
    public const AUDIO_MIMES = 'mp3,wav,ogg,m4a,aac,flac,webm';
    public const VIDEO_MIMES = 'mp4,mov,avi,mkv,webm,m4v,3gp';
    public const DOCUMENT_MIMES = 'pdf,doc,docx,xls,xlsx,ppt,pptx,txt,csv,rtf,zip,rar';

    // Laravel max values are KB. These limits are intentionally high for large uploads.
    public const IMAGE_MAX_KB = 51200;      // 50 MB
    public const AUDIO_MAX_KB = 512000;     // 500 MB
    public const VIDEO_MAX_KB = 2097152;    // 2 GB
    public const DOCUMENT_MAX_KB = 512000;  // 500 MB

    public static function image(bool $required = false): string
    {
        return ($required ? 'required' : 'nullable') . '|image|mimes:' . self::IMAGE_MIMES . '|max:' . self::IMAGE_MAX_KB;
    }

    public static function audio(bool $required = false): string
    {
        return ($required ? 'required' : 'nullable') . '|file|mimes:' . self::AUDIO_MIMES . '|max:' . self::AUDIO_MAX_KB;
    }

    public static function video(bool $required = false): string
    {
        return ($required ? 'required' : 'nullable') . '|file|mimes:' . self::VIDEO_MIMES . '|max:' . self::VIDEO_MAX_KB;
    }

    public static function document(bool $required = false): string
    {
        return ($required ? 'required' : 'nullable') . '|file|mimes:' . self::DOCUMENT_MIMES . '|max:' . self::DOCUMENT_MAX_KB;
    }
}
