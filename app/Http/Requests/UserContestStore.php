<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UserContestStore extends FormRequest
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
            'prizes' => 'required|array',
            'prizes.*' => 'integer|exists:prizes,id',
            'sponsor_ids' => 'required|array',
            'sponsor_ids.*' => 'integer|exists:sponsors,id',
            'sponsor_banners' => 'nullable|array',
            'sponsor_banners.*.file' => 'nullable|file|mimes:jpg,jpeg,png|max:2048',
            'payment_type' => 'required|in:free,paid',
            'user_type'    => 'required|in:all,user,member',
            'amount'       => 'nullable|numeric|min:0',
            'type'         => 'required|in:manual,google_form',
            'form_url'     => 'nullable|url',
            'formats'      => 'nullable|array',
            'admin_approval' => 'nullable',
            'email' => 'nullable',
            'phone' => 'nullable',
            'link' => 'nullable'
        ];
    }
}
