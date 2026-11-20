<?php

namespace App\Http\Resources;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderRound;
use App\Policies\OrderPolicy;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Order */
class OrderDetailResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $user = $request->user();
        $policy = new OrderPolicy;

        return [
            ...(new OrderSummaryResource($this->resource))->toArray($request),
            'customer_phone' => $this->customer_phone,
            'delivery_address' => $this->delivery_address,
            'change_window_minutes' => $this->branch->change_window_minutes,
            'paid_cents' => $this->paidCents(),
            'can_charge' => $user->can('charge', $this->resource),
            'can_receipt' => $user->can('viewReceipt', $this->resource),
            'can_cancel' => $user->can('cancel', $this->resource),
            'can_restore' => $user->can('restore', $this->resource),
            'can_move_tables' => $this->isOpen() && $user->can('moveTables', $this->resource),
            'rounds' => $this->rounds->map(fn (OrderRound $round) => [
                'id' => $round->id,
                'sent_at' => $round->sent_at->toIso8601String(),
                'cancelled_at' => $round->cancelled_at?->toIso8601String(),
                'user_name' => $round->user->name,
                'kitchen_stage' => $round->kitchenStage()?->value,
                'kitchen_label' => $round->kitchenStage()?->label(),
                'received_at' => $round->received_at?->toIso8601String(),
                'preparing_at' => $round->preparing_at?->toIso8601String(),
                'ready_at' => $round->ready_at?->toIso8601String(),
                'handed_at' => $round->handed_at?->toIso8601String(),
                'subtotal_cents' => (int) $round->items
                    ->filter(fn (OrderItem $item) => $item->cancelled_at === null)
                    ->sum(fn (OrderItem $item) => $item->unit_price_cents * $item->quantity),
                'can_cancel' => $user->can('cancelRound', $round),
                'can_restore' => $user->can('restoreRound', $round),
                'items' => $round->items->map(fn (OrderItem $item) => [
                    'id' => $item->id,
                    'product_name' => $item->product_name,
                    'variant_name' => $item->variant_name,
                    'quantity' => $item->quantity,
                    'unit_price_cents' => $item->unit_price_cents,
                    'note' => $item->note,
                    'needs_kitchen' => $item->needs_kitchen,
                    'served_at' => $item->served_at?->toIso8601String(),
                    'cancelled_at' => $item->cancelled_at?->toIso8601String(),
                    'changeable_until' => $policy->changeableUntil($item)?->toIso8601String(),
                    'can_cancel' => $user->can('cancelItem', $item),
                    'can_restore' => $user->can('restoreItem', $item),
                    'can_serve' => $user->can('serveItem', $item) && $item->served_at === null,
                    'can_unserve' => $user->can('serveItem', $item) && $item->served_at !== null,
                ])->all(),
            ])->all(),
        ];
    }
}
