<?php

namespace App\Http\Resources;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Order */
class ReceiptResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $paid = $this->paidCents();

        return [
            ...(new OrderSummaryResource($this->resource))->toArray($request),
            'paid_at' => $this->paid_at?->toIso8601String(),
            'paid_cents' => $paid,
            'remaining_cents' => max(0, $this->total_cents - $paid),
            'branch' => [
                'name' => $this->branch->name,
                'address' => $this->branch->address,
                'phone' => $this->branch->phone,
            ],
            'lines' => $this->rounds
                ->whereNull('cancelled_at')
                ->flatMap(fn ($round) => $round->items)
                ->whereNull('cancelled_at')
                ->map(fn (OrderItem $item) => [
                    'id' => $item->id,
                    'name' => $item->product_name,
                    'variant' => $item->variant_name,
                    'quantity' => $item->quantity,
                    'unit_price_cents' => $item->unit_price_cents,
                    'total_cents' => $item->unit_price_cents * $item->quantity,
                ])
                ->values()
                ->all(),
            'payments' => $this->payments
                ->map(fn (Payment $payment) => (new PaymentResource($payment))->toArray($request))
                ->all(),
        ];
    }
}
