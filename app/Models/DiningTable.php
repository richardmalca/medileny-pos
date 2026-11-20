<?php

namespace App\Models;

use App\Enums\OrderStatus;
use Database\Factories\DiningTableFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * @property int $id
 * @property int $branch_id
 * @property int $zone_id
 * @property string $name
 * @property int $capacity
 * @property int $sort_order
 * @property bool $is_active
 */
#[Fillable(['branch_id', 'zone_id', 'name', 'capacity', 'sort_order', 'is_active'])]
class DiningTable extends Model
{
    /** @use HasFactory<DiningTableFactory> */
    use HasFactory;

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    /** @return BelongsTo<Branch, $this> */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /** @return BelongsTo<Zone, $this> */
    public function zone(): BelongsTo
    {
        return $this->belongsTo(Zone::class);
    }

    /** @return BelongsToMany<Order, $this> */
    public function orders(): BelongsToMany
    {
        return $this->belongsToMany(Order::class, 'order_table');
    }

    /** @return BelongsToMany<Order, $this> */
    public function openOrders(): BelongsToMany
    {
        return $this->orders()->where('orders.status', OrderStatus::Open->value);
    }
}
