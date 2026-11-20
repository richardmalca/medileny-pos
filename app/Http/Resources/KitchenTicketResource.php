<?php

namespace App\Http\Resources;

use App\Enums\KitchenStage;
use App\Enums\OrderStatus;
use App\Models\OrderItem;
use App\Models\OrderRound;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin OrderRound */
class KitchenTicketResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $stage = KitchenStage::of($this->resource);
        $next = KitchenStage::tryFrom($stage->value + 1);
        $previous = KitchenStage::tryFrom($stage->value - 1);
        $summary = (new OrderSummaryResource($this->order))->toArray($request);

        return [
            'id' => $this->id,
            'order_id' => $this->order_id,
            'label' => $summary['label'],
            'type' => $summary['type'],
            'type_label' => $summary['type_label'],
            'customer_name' => $this->order->customer_name,
            'waiter_name' => $this->user->name,
            'sent_at' => $this->sent_at->toIso8601String(),
            'received_at' => $this->received_at?->toIso8601String(),
            'preparing_at' => $this->preparing_at?->toIso8601String(),
            'ready_at' => $this->ready_at?->toIso8601String(),
            'handed_at' => $this->handed_at?->toIso8601String(),
            'cancelled_at' => ($this->cancelled_at ?? ($this->order->status === OrderStatus::Cancelled ? $this->order->updated_at : null))?->toIso8601String(),
            'stage' => $stage->value,
            'stage_label' => $stage->label(),
            'next_stage' => $next?->value,
            'next_label' => $next?->actionLabel(),
            'previous_stage' => $previous?->value,
            'can_update' => $request->user()->can('updateKitchen', $this->resource),
            'items' => $this->items
                ->filter(fn (OrderItem $item) => $item->needs_kitchen)
                ->map(fn (OrderItem $item) => [
                    'id' => $item->id,
                    'quantity' => $item->quantity,
                    'product_name' => $item->product_name,
                    'variant_name' => $item->variant_name,
                    'note' => $item->note,
                    'cancelled' => $item->cancelled_at !== null,
                ])
                ->values()
                ->all(),
        ];
    }
}
