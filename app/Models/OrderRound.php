<?php

namespace App\Models;

use App\Enums\KitchenStage;
use App\Policies\OrderPolicy;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $order_id
 * @property int $user_id
 * @property string $client_id
 * @property Carbon $sent_at
 * @property Carbon|null $received_at
 * @property Carbon|null $preparing_at
 * @property Carbon|null $ready_at
 * @property Carbon|null $handed_at
 * @property int|null $kitchen_user_id
 * @property Carbon|null $cancelled_at
 */
#[Fillable([
    'order_id', 'user_id', 'client_id', 'sent_at', 'received_at', 'preparing_at',
    'ready_at', 'handed_at', 'kitchen_user_id', 'cancelled_at',
])]
#[UsePolicy(OrderPolicy::class)]
class OrderRound extends Model
{
    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'sent_at' => 'datetime',
            'received_at' => 'datetime',
            'preparing_at' => 'datetime',
            'ready_at' => 'datetime',
            'handed_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    public function isCancelled(): bool
    {
        return $this->cancelled_at !== null;
    }

    public function hasKitchenItems(): bool
    {
        return $this->items->contains(fn (OrderItem $item) => $item->needs_kitchen);
    }

    public function kitchenStage(): ?KitchenStage
    {
        return $this->hasKitchenItems() ? KitchenStage::of($this) : null;
    }

    /** @return BelongsTo<Order, $this> */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return HasMany<OrderItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class)->orderBy('id')->chaperone('round');
    }
}
