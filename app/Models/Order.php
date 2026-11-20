<?php

namespace App\Models;

use App\Enums\KitchenStage;
use App\Enums\OrderStatus;
use App\Enums\OrderType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $branch_id
 * @property int $user_id
 * @property int $number
 * @property OrderType $type
 * @property OrderStatus $status
 * @property string|null $customer_name
 * @property string|null $customer_phone
 * @property string|null $delivery_address
 * @property int $total_cents
 * @property Carbon|null $paid_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'branch_id', 'user_id', 'number', 'type', 'status',
    'customer_name', 'customer_phone', 'delivery_address', 'total_cents', 'paid_at',
])]
class Order extends Model
{
    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'type' => OrderType::class,
            'status' => OrderStatus::class,
            'paid_at' => 'datetime',
        ];
    }

    public function kitchenAttention(): ?KitchenStage
    {
        $priority = [
            KitchenStage::Ready->value => 4,
            KitchenStage::Preparing->value => 3,
            KitchenStage::Received->value => 2,
            KitchenStage::New->value => 1,
        ];

        return $this->activeRounds
            ->map(fn (OrderRound $round) => $round->kitchenStage())
            ->filter(fn (?KitchenStage $stage) => $stage !== null && $stage !== KitchenStage::Handed)
            ->sortByDesc(fn (KitchenStage $stage) => $priority[$stage->value])
            ->first();
    }

    public function label(): string
    {
        $names = $this->tables->pluck('name')->all();

        return $names !== []
            ? implode(' + ', $names)
            : $this->type->label().' #'.$this->number;
    }

    public function isOpen(): bool
    {
        return $this->status === OrderStatus::Open;
    }

    /** @return BelongsTo<Branch, $this> */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsToMany<DiningTable, $this> */
    public function tables(): BelongsToMany
    {
        return $this->belongsToMany(DiningTable::class, 'order_table')->orderBy('dining_tables.sort_order');
    }

    /** @return HasMany<OrderRound, $this> */
    public function rounds(): HasMany
    {
        return $this->hasMany(OrderRound::class)->orderByDesc('sent_at')->orderByDesc('id')->chaperone('order');
    }

    /** @return HasMany<OrderRound, $this> */
    public function activeRounds(): HasMany
    {
        return $this->rounds()->whereNull('cancelled_at');
    }

    /** @return HasMany<Payment, $this> */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class)->orderBy('id');
    }

    public function paidCents(): int
    {
        return (int) $this->payments->whereNull('voided_at')->sum('amount_cents');
    }

    /** @return HasMany<OrderItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}
