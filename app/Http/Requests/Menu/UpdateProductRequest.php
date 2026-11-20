<?php

namespace App\Http\Requests\Menu;

use App\Models\Product;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->target());
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:255'],
            'category_id' => ['required', 'integer', Rule::exists('categories', 'id')],
            'variants' => ['required', 'array', 'min:1', 'max:10'],
            'variants.*.id' => [
                'nullable',
                'integer',
                Rule::exists('product_variants', 'id')->where('product_id', $this->target()->id),
            ],
            'variants.*.name' => ['required', 'string', 'max:60'],
            'variants.*.price' => ['required', 'decimal:0,2', 'min:0.1', 'max:9999.99'],
        ];
    }

    private function target(): Product
    {
        $product = $this->route('product');

        return $product instanceof Product ? $product : throw new NotFoundHttpException;
    }
}
