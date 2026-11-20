<?php

namespace App\Http\Requests\Cash;

use App\Enums\PaymentMethod;
use App\Models\Order;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class StorePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        $order = $this->route('order');

        return $order instanceof Order
            ? $this->user()->can('charge', $order)
            : throw new NotFoundHttpException;
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'client_id' => ['required', 'uuid'],
            'method' => ['required', Rule::enum(PaymentMethod::class)],
            'amount' => ['required', 'decimal:0,2', 'min:0.1', 'max:99999.99'],
            'tendered' => ['nullable', 'decimal:0,2', 'min:0', 'max:99999.99'],
            'reference' => ['nullable', 'string', 'max:40'],
            'inline' => ['nullable', 'boolean'],
        ];
    }
}
