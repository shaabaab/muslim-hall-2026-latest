<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PostUpdateRequest extends FormRequest
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

        'thumbnail' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp',
        'sponsor' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp',

        'remove_thumbnail' => 'nullable|boolean',
        'remove_sponsor' => 'nullable|boolean',
        'remove_audio' => 'nullable|boolean',

        'featured_images' => 'nullable|array',
        'featured_images.*' => 'image|mimes:jpeg,png,jpg,gif,webp',

        'content' => 'nullable|string',

        'pdf' => 'nullable|file|mimes:pdf',
        'video' => 'nullable|file|mimes:mp4,avi,mov,wmv,mkv,webm',
        'audio' => 'nullable|file|mimes:mp3,wav,ogg,m4a,aac',

        'video_url' => 'nullable|url',
        'status' => 'nullable|boolean',
    ];
}
}
