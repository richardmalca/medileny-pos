<?php

namespace App\Http\Resources;

use App\Models\DiningTable;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin DiningTable */
class DiningTableResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'zone_id' => $this->zone_id,
            'name' => $this->name,
            'capacity' => $this->capacity,
            'is_active' => $this->is_active,
            'order' => $this->whenLoaded('openOrders', function () use ($request) {
                $order = $this->openOrders->first();

                return $order ? (new OrderSummaryResource($order))->toArray($request) : null;
            }),
        ];
    }
}
