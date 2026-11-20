<?php

namespace App\Concerns;

use App\Models\ProductVariant;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

trait OrderItemRules
{
    /** @return array<string, ValidationRule|array<mixed>|string> */
    protected function itemRules(): array
    {
        return [
            'client_id' => ['required', 'uuid'],
            'items' => ['required', 'array', 'min:1', 'max:50'],
            'items.*.variant_id' => ['required', 'integer', $this->availableVariant(...)],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:50'],
            'items.*.note' => ['nullable', 'string', 'max:120'],
        ];
    }

    private function availableVariant(string $attribute, mixed $value, Closure $fail): void
    {
        $available = ProductVariant::whereKey($value)
            ->whereHas('product', fn ($query) => $query->where('is_available', true))
            ->exists();

        if (! $available) {
            $fail('Un producto del pedido ya no está disponible.');
        }
    }
}
