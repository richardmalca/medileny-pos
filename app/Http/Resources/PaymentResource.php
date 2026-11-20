<?php

namespace App\Http\Resources;

use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Payment */
class PaymentResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_id' => $this->order_id,
            'order_label' => $this->whenLoaded('order', fn () => (new OrderSummaryResource($this->order))->toArray($request)['label']),
            'method' => $this->method->value,
            'method_label' => $this->method->label(),
            'amount_cents' => $this->amount_cents,
            'tendered_cents' => $this->tendered_cents,
            'change_cents' => $this->changeCents(),
            'reference' => $this->reference,
            'user_name' => $this->whenLoaded('user', fn () => $this->user->name),
            'created_at' => $this->created_at?->toIso8601String(),
            'voided_at' => $this->voided_at?->toIso8601String(),
            'can_void' => $request->user()->can('void', $this->resource),
        ];
    }
}
