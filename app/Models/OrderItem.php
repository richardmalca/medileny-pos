<?php

namespace App\Models;

use App\Policies\OrderPolicy;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $order_id
 * @property int $order_round_id
 * @property int $product_variant_id
 * @property string $product_name
 * @property string $variant_name
 * @property int $unit_price_cents
 * @property int $quantity
 * @property string|null $note
 * @property bool $needs_kitchen
 * @property Carbon|null $served_at
 * @property Carbon|null $cancelled_at
 */
#[Fillable([
    'order_id', 'order_round_id', 'product_variant_id', 'product_name', 'variant_name',
    'unit_price_cents', 'quantity', 'note', 'needs_kitchen', 'served_at', 'cancelled_at',
])]
#[UsePolicy(OrderPolicy::class)]
class OrderItem extends Model
{
    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'needs_kitchen' => 'boolean',
            'served_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    public function isActive(): bool
    {
        return $this->cancelled_at === null && ! $this->round->isCancelled();
    }

    /** @return BelongsTo<Order, $this> */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /** @return BelongsTo<OrderRound, $this> */
    public function round(): BelongsTo
    {
        return $this->belongsTo(OrderRound::class, 'order_round_id');
    }

    /** @return BelongsTo<ProductVariant, $this> */
    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }
}
