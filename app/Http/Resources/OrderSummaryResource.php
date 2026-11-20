<?php

namespace App\Http\Resources;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Order */
class OrderSummaryResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $rounds = $this->activeRounds;
        $tableNames = $this->tables->pluck('name')->all();

        return [
            'id' => $this->id,
            'number' => $this->number,
            'type' => $this->type->value,
            'type_label' => $this->type->label(),
            'label' => $this->label(),
            'status' => $this->status->value,
            'customer_name' => $this->customer_name,
            'total_cents' => $this->total_cents,
            'table_names' => $tableNames,
            'table_ids' => $this->tables->pluck('id')->all(),
            'paid_cents' => $this->whenLoaded('payments', fn () => $this->paidCents()),
            'kitchen_stage' => $this->kitchenAttention()?->value,
            'kitchen_label' => $this->kitchenAttention()?->label(),
            'items_count' => (int) $rounds->sum(fn ($round) => $round->items->sum('quantity')),
            'opened_at' => $this->created_at?->toIso8601String(),
            'waiting_since' => $rounds->sortByDesc('sent_at')->first()?->sent_at->toIso8601String(),
        ];
    }
}
