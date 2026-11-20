<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Models\DiningTable;
use App\Models\Order;
use App\Models\User;
use App\Models\Zone;
use Illuminate\Database\Eloquent\Collection;

class FloorService
{
    /** @return Collection<int, Zone> */
    public function zones(User $user): Collection
    {
        return Zone::query()
            ->where('branch_id', $user->branch_id)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->with(['tables' => fn ($query) => $query
                ->where('is_active', true)
                ->with(['openOrders.tables', 'openOrders.activeRounds.items'])])
            ->get();
    }

    /** @return Collection<int, Order> */
    public function looseOrders(User $user): Collection
    {
        return Order::query()
            ->where('branch_id', $user->branch_id)
            ->where('status', OrderStatus::Open->value)
            ->whereDoesntHave('tables')
            ->with(['tables', 'activeRounds.items'])
            ->orderBy('created_at')
            ->get();
    }

    /** @return array<int, array{id: int, name: string, tables: array<int, array{id: int, name: string, capacity: int, selectable: bool}>}> */
    public function tableOptions(User $user, Order $order): array
    {
        return $this->zones($user)
            ->map(fn (Zone $zone) => [
                'id' => $zone->id,
                'name' => $zone->name,
                'tables' => $zone->tables
                    ->map(fn (DiningTable $table) => [
                        'id' => $table->id,
                        'name' => $table->name,
                        'capacity' => $table->capacity,
                        'selectable' => $table->openOrders->every(fn (Order $open) => $open->is($order)),
                    ])
                    ->values()
                    ->all(),
            ])
            ->values()
            ->all();
    }
}
