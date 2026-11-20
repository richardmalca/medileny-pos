<?php

namespace App\Http\Resources;

use App\Models\CashSession;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin CashSession */
class CashSessionResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'opened_at' => $this->opened_at->toIso8601String(),
            'closed_at' => $this->closed_at?->toIso8601String(),
            'opened_by_name' => $this->whenLoaded('opener', fn () => $this->opener->name),
            'opening_cents' => $this->opening_cents,
            'expected_cents' => $this->expected_cents,
            'counted_cents' => $this->counted_cents,
            'difference_cents' => $this->difference_cents,
            'can_close' => $request->user()->can('close', $this->resource),
            'can_undo_open' => $request->user()->can('undoOpen', $this->resource),
            'can_reopen' => $request->user()->can('reopen', $this->resource),
        ];
    }
}
