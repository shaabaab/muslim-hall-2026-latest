<?php

namespace App\Http\Requests\user;

use Illuminate\Foundation\Http\FormRequest;

class StoreEntryRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'media_path' => 'nullable|file|mimes:jpg,jpeg,png,pdf,doc,docx',
            'content'    => 'nullable|string',
            'contest_id' => 'nullable|exists:contests,id',
            'thumbnail'  => 'nullable|image|mimes:jpg,jpeg,png,webp',
            'image'      => 'nullable|image|mimes:jpg,jpeg,png,webp',
            // Large files — processed via queue job; large files come as temp_path strings (chunked upload)
            // Small files (<5MB) are sent directly, so no max constraint needed here
            'video' => 'nullable|file|mimes:mp4,mov,avi,mkv,webm,m4v,3gp',
            'audio' => 'nullable|file|mimes:mp3,wav,ogg,m4a,aac,flac,webm',
            'pdf'   => 'nullable|file|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,txt,csv,rtf,zip,rar',
            'images' => 'nullable|array',
            'images.*' => 'nullable|image|mimes:jpg,jpeg,png,webp',
            'video_temp_path' => 'nullable|string',
            'audio_temp_path' => 'nullable|string',
            'pdf_temp_path' => 'nullable|string',
            'payment_info' => 'nullable|array',
            'payment_info.method' => 'nullable|string',
            'payment_info.number' => 'nullable|string',
            'payment_info.transactionId' => 'nullable|string',
        ];
    }
}
