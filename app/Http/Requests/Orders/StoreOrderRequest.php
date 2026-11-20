<?php

namespace App\Http\Requests\Orders;

use App\Concerns\OrderItemRules;
use App\Enums\OrderType;
use App\Models\Order;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreOrderRequest extends FormRequest
{
    use OrderItemRules;

    public function authorize(): bool
    {
        return $this->user()->can('create', Order::class);
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        $isDelivery = $this->input('type') === OrderType::Delivery->value;

        return [
            ...$this->itemRules(),
            'type' => ['required', Rule::enum(OrderType::class)],
            'table_ids' => [
                Rule::requiredIf($this->input('type') === OrderType::DineIn->value),
                'nullable', 'array', 'max:8',
            ],
            'table_ids.*' => [
                'integer',
                Rule::exists('dining_tables', 'id')
                    ->where('branch_id', $this->user()->branch_id)
                    ->where('is_active', true),
            ],
            'customer_name' => [Rule::requiredIf($isDelivery), 'nullable', 'string', 'max:80'],
            'customer_phone' => [Rule::requiredIf($isDelivery), 'nullable', 'string', 'max:20'],
            'delivery_address' => [Rule::requiredIf($isDelivery), 'nullable', 'string', 'max:255'],
        ];
    }
}
