<?php

namespace App\Http\Requests\Orders;

use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class ServeItemsRequest extends FormRequest
{
    public function authorize(): bool
    {
        $order = $this->route('order');

        if (! $order instanceof Order) {
            throw new NotFoundHttpException;
        }

        return OrderItem::query()
            ->whereIn('id', $this->array('item_ids'))
            ->where('order_id', $order->id)
            ->with('round.order.branch')
            ->get()
            ->every(fn (OrderItem $item) => $this->user()->can('serveItem', $item));
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        $order = $this->route('order');

        return [
            'served' => ['required', 'boolean'],
            'item_ids' => ['required', 'array', 'min:1', 'max:50'],
            'item_ids.*' => [
                'integer',
                Rule::exists('order_items', 'id')->where('order_id', $order instanceof Order ? $order->id : 0),
            ],
        ];
    }
}
