<?php

namespace App\Services;

use App\Enums\KitchenStage;
use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Events\FloorChanged;
use App\Events\KitchenTicketChanged;
use App\Models\DiningTable;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderRound;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderService
{
    /** @param array<string, mixed> $data */
    public function open(User $user, array $data): OrderRound
    {
        $existing = OrderRound::where('client_id', $data['client_id'])->first();

        if ($existing !== null) {
            return $existing;
        }

        return DB::transaction(function () use ($user, $data) {
            $type = OrderType::from($data['type']);
            $tableIds = $type === OrderType::Delivery
                ? []
                : array_values(array_unique($data['table_ids'] ?? []));

            $this->assertTablesFree($tableIds);

            $order = Order::create([
                'branch_id' => $user->branch_id,
                'user_id' => $user->id,
                'number' => $this->nextNumber((int) $user->branch_id),
                'type' => $type,
                'status' => OrderStatus::Open,
                'customer_name' => $data['customer_name'] ?? null,
                'customer_phone' => $data['customer_phone'] ?? null,
                'delivery_address' => $type === OrderType::Delivery ? $data['delivery_address'] : null,
                'total_cents' => 0,
            ]);

            $order->tables()->attach($tableIds);

            return $this->recordRound($user, $order, $data['client_id'], $data['items']);
        });
    }

    /** @param array<string, mixed> $data */
    public function addRound(User $user, Order $order, array $data): OrderRound
    {
        $existing = OrderRound::where('client_id', $data['client_id'])->first();

        if ($existing !== null) {
            return $existing;
        }

        return DB::transaction(
            fn () => $this->recordRound($user, $order, $data['client_id'], $data['items']),
        );
    }

    public function cancelRound(OrderRound $round): OrderRound
    {
        return DB::transaction(function () use ($round) {
            $round->update(['cancelled_at' => now()]);
            $this->settle($round->order);
            $this->announce($round->order, $round, KitchenTicketChanged::CANCELLED);
            $this->changed($round->order, 'round_cancelled');

            return $round;
        });
    }

    public function restoreRound(OrderRound $round): OrderRound
    {
        return DB::transaction(function () use ($round) {
            $this->reopen($round->order);
            $round->update(['cancelled_at' => null]);
            $this->settle($round->order);
            $this->announce($round->order, $round, KitchenTicketChanged::NEW);
            $this->changed($round->order, 'round_restored');

            return $round;
        });
    }

    public function cancelItem(OrderItem $item): OrderItem
    {
        return DB::transaction(function () use ($item) {
            $item->update(['cancelled_at' => now()]);
            $this->settle($item->round->order);
            $this->announce($item->round->order, $item->round, $item->needs_kitchen ? KitchenTicketChanged::ITEM_CANCELLED : KitchenTicketChanged::UPDATED);
            $this->changed($item->round->order, 'item_cancelled');

            return $item;
        });
    }

    public function restoreItem(OrderItem $item): OrderItem
    {
        return DB::transaction(function () use ($item) {
            $this->reopen($item->round->order);
            $item->update(['cancelled_at' => null]);
            $this->settle($item->round->order);
            $this->announce($item->round->order, $item->round, KitchenTicketChanged::UPDATED);
            $this->changed($item->round->order, 'item_restored');

            return $item;
        });
    }

    public function cancelOrder(Order $order): Order
    {
        $order->update(['status' => OrderStatus::Cancelled]);

        $order->activeRounds->each(fn (OrderRound $round) => $this->announce($order, $round, KitchenTicketChanged::CANCELLED));
        $this->changed($order, 'order_cancelled');

        return $order;
    }

    public function restoreOrder(Order $order): Order
    {
        return DB::transaction(function () use ($order) {
            $this->reopen($order);

            $order->activeRounds->each(fn (OrderRound $round) => $this->announce($order, $round, KitchenTicketChanged::NEW));
            $this->changed($order, 'order_restored');

            return $order;
        });
    }

    /** @param array<int, int> $itemIds */
    public function setServed(Order $order, array $itemIds, bool $served): void
    {
        $order->items()
            ->whereIn('id', $itemIds)
            ->update(['served_at' => $served ? now() : null]);

        $this->changed($order, 'served');
    }

    /** @param array<int, int> $tableIds */
    public function moveTables(Order $order, array $tableIds): Order
    {
        return DB::transaction(function () use ($order, $tableIds) {
            $ids = array_values(array_unique($tableIds));

            if ($order->type === OrderType::Delivery && $ids !== []) {
                throw ValidationException::withMessages(['table_ids' => 'Un pedido a domicilio no usa mesas.']);
            }

            if ($order->type === OrderType::DineIn && $ids === []) {
                throw ValidationException::withMessages(['table_ids' => 'Una cuenta de mesa necesita al menos una mesa.']);
            }

            $this->assertTablesFree($ids, $order);
            $order->tables()->sync($ids);
            $this->changed($order, 'tables_moved');

            return $order;
        });
    }

    /**
     * @param  array<int, int>  $ids
     * @return Collection<int, DiningTable>
     */
    public function freeTables(User $user, array $ids): Collection
    {
        return DiningTable::query()
            ->whereIn('id', $ids)
            ->where('branch_id', $user->branch_id)
            ->where('is_active', true)
            ->whereDoesntHave('openOrders')
            ->orderBy('sort_order')
            ->get();
    }

    public function reopen(Order $order): void
    {
        if ($order->status === OrderStatus::Open) {
            return;
        }

        $this->assertTablesFree($order->tables()->pluck('dining_tables.id')->all(), $order);
        $order->update(['status' => OrderStatus::Open, 'paid_at' => null]);
    }

    private function settle(Order $order): void
    {
        $this->refreshTotal($order);

        if (! $this->activeItems($order)->exists()) {
            $order->update(['status' => OrderStatus::Cancelled]);
        }
    }

    /** @param array<int, mixed> $tableIds */
    private function assertTablesFree(array $tableIds, ?Order $except = null): void
    {
        if ($tableIds === []) {
            return;
        }

        $zones = DiningTable::query()->whereIn('id', $tableIds)->distinct()->pluck('zone_id');

        if ($zones->count() > 1) {
            throw ValidationException::withMessages([
                'table_ids' => 'Solo puedes juntar mesas de la misma zona.',
            ]);
        }

        $busy = DiningTable::query()
            ->whereIn('id', $tableIds)
            ->whereHas('openOrders', fn ($query) => $except ? $query->whereKeyNot($except->id) : $query)
            ->pluck('name');

        if ($busy->isEmpty()) {
            return;
        }

        throw ValidationException::withMessages([
            'table_ids' => $busy->count() === 1
                ? "La {$busy->first()} ya está ocupada."
                : 'Las mesas '.$busy->join(', ', ' y ').' ya están ocupadas.',
        ]);
    }

    /** @param list<array<string, mixed>> $items */
    private function recordRound(User $user, Order $order, string $clientId, array $items): OrderRound
    {
        $round = $order->rounds()->create([
            'user_id' => $user->id,
            'client_id' => $clientId,
            'sent_at' => now(),
        ]);

        $variants = ProductVariant::with('product.category')
            ->whereIn('id', array_column($items, 'variant_id'))
            ->get()
            ->keyBy('id');

        foreach ($items as $item) {
            $variant = $variants[$item['variant_id']];

            $round->items()->create([
                'order_id' => $order->id,
                'product_variant_id' => $variant->id,
                'product_name' => $variant->product->name,
                'variant_name' => $variant->name,
                'unit_price_cents' => $variant->price_cents,
                'quantity' => $item['quantity'],
                'note' => $item['note'] ?? null,
                'needs_kitchen' => $variant->product->category->needs_kitchen,
            ]);
        }

        $this->refreshTotal($order);
        $this->announce($order, $round, KitchenTicketChanged::NEW);
        $this->changed($order, 'round_sent');

        return $round;
    }

    private function changed(Order $order, string $reason): void
    {
        FloorChanged::dispatch($order->branch_id, $reason, $order->id);
    }

    private function announce(Order $order, OrderRound $round, string $kind): void
    {
        $round->loadMissing('items');

        if (! $round->hasKitchenItems()) {
            return;
        }

        $order->loadMissing('tables');

        KitchenTicketChanged::dispatch(
            $order->branch_id,
            $round->id,
            $order->id,
            $round->user_id,
            $order->label(),
            $kind,
            KitchenStage::of($round)->value,
            KitchenStage::of($round)->label(),
        );
    }

    private function refreshTotal(Order $order): void
    {
        $total = $this->activeItems($order)
            ->get()
            ->sum(fn (OrderItem $item) => $item->unit_price_cents * $item->quantity);

        $order->update(['total_cents' => $total]);
    }

    /** @return Builder<OrderItem> */
    private function activeItems(Order $order): Builder
    {
        return OrderItem::query()
            ->where('order_id', $order->id)
            ->whereNull('cancelled_at')
            ->whereHas('round', fn ($query) => $query->whereNull('cancelled_at'));
    }

    private function nextNumber(int $branchId): int
    {
        return 1 + (int) Order::where('branch_id', $branchId)
            ->whereDate('created_at', today())
            ->max('number');
    }
}
