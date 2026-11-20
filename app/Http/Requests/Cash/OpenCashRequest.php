<?php

namespace App\Http\Requests\Cash;

use App\Models\CashSession;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class OpenCashRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('open', CashSession::class);
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'opening' => ['required', 'decimal:0,2', 'min:0', 'max:99999.99'],
        ];
    }
}
