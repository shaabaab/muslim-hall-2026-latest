<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Support\UploadRules;

class PostStoreRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'title' => 'required|string|max:255',
            'lang_id' => 'nullable|exists:languages,id',
            'category_id' => 'nullable|exists:categories,id',
            'thumbnail' => UploadRules::image(),
            'featured_images' => 'nullable|array',
            'featured_images.*' => UploadRules::image(),
            'sponsor' => UploadRules::image(),
            'content' => 'nullable|string',
            'pdf' => UploadRules::document(),
            'video' => UploadRules::video(),
            'audio' => UploadRules::audio(),
            'videos' => 'nullable|array',
            'videos.*' => UploadRules::video(),
            'pdfs' => 'nullable|array',
            'pdfs.*' => UploadRules::document(),
            'audios' => 'nullable|array',
            'audios.*' => UploadRules::audio(),
            'video_temp_paths' => 'nullable|array',
            'pdf_temp_paths' => 'nullable|array',
            'audio_temp_paths' => 'nullable|array',
            'remove_videos' => 'nullable|array',
            'remove_pdfs' => 'nullable|array',
            'remove_audios' => 'nullable|array',
            'video_url' => 'nullable|url',
            'status' => 'nullable|in:0,1',
        ];
    }
}
