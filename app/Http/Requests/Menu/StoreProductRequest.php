<?php

namespace App\Http\Requests\Menu;

use App\Models\Product;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Product::class);
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:255'],
            'category_id' => ['required', 'integer', Rule::exists('categories', 'id')],
            'variants' => ['required', 'array', 'min:1', 'max:10'],
            'variants.*.name' => ['required', 'string', 'max:60'],
            'variants.*.price' => ['required', 'decimal:0,2', 'min:0.1', 'max:9999.99'],
        ];
    }
}
