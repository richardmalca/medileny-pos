<?php

namespace App\Http\Requests\Orders;

use App\Concerns\OrderItemRules;
use App\Models\Order;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class AppendRoundRequest extends FormRequest
{
    use OrderItemRules;

    public function authorize(): bool
    {
        $order = $this->route('order');

        return $order instanceof Order
            ? $this->user()->can('addRound', $order)
            : throw new NotFoundHttpException;
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            ...$this->itemRules(),
            'redirect' => ['nullable', 'in:floor'],
        ];
    }
}
