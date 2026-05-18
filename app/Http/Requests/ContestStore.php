<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ContestStore extends FormRequest
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
            'start_date' => 'required|date',
            'status' => 'required',
            'end_date' => 'required|date|after_or_equal:start_date',
            'category_id' => 'required|integer|exists:contest_categories,id',
            'prizes' => 'nullable|array',             
            'prizes.*' => 'integer|exists:prizes,id',
            'payment_type' => 'required|in:free,paid',
            'user_type' => 'required|in:all,user,member',
            // 'admin_approval'=>'nullable',
            // 'email'=>'nullable',
            // 'phone'=>'nullable',
            // 'link'=>'nullable'
        ];
    }
}
