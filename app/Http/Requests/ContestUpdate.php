<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ContestUpdate extends FormRequest
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
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'required|integer|in:1,2,3,4',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'category_id' => 'required|integer|exists:contest_categories,id',
            'prizes' => 'nullable|array',             
            'prizes.*' => 'integer|exists:prizes,id',
        ];
    }
}
