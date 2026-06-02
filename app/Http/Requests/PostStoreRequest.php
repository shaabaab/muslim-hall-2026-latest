<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PostStoreRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'title'            => 'required|string|max:255',
            'lang_id'          => 'nullable|exists:languages,id',
            'category_id'      => 'nullable|exists:categories,id',
            'thumbnail'        => 'nullable|image',
            'featured_images'  => 'nullable|array',
            'featured_images.*'=> 'image',
            'sponsor'          => 'nullable|image',
            'content'          => 'nullable|string',

            // Large files are stored to temp then uploaded via queue job — no max limit here
            'pdf'   => 'nullable|file|mimes:pdf',
            'video' => 'nullable|file',
            'audio' => 'nullable|file',

            'video_url' => 'nullable|url',
            'status'    => 'nullable|in:0,1',
        ];
    }
}
