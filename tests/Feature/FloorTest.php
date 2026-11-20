<?php

use App\Enums\Role;
use App\Models\Branch;
use App\Models\DiningTable;
use App\Models\Order;
use App\Models\ProductVariant;
use App\Models\User;
use App\Models\Zone;
use Database\Seeders\RoleSeeder;
use Illuminate\Support\Str;

beforeEach(function () {
    $this->seed(RoleSeeder::class);
    $this->branch = Branch::factory()->create(['warn_after_minutes' => 10, 'alert_after_minutes' => 20]);
    $this->waiter = User::factory()->for($this->branch)->create()->assignRole(Role::Waiter->value);

    $this->zone = Zone::factory()->create(['branch_id' => $this->branch->id, 'name' => 'Terraza']);
    $this->table = DiningTable::factory()->inZone($this->zone)->create(['name' => 'Mesa 7', 'capacity' => 4]);
});

it('shows only the zones and tables of the waiter branch', function () {
    $otherZone = Zone::factory()->create();
    DiningTable::factory()->inZone($otherZone)->create();

    $this->actingAs($this->waiter)
        ->get(route('floor.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('floor/index')
            ->has('zones', 1)
            ->has('categories')
            ->where('zones.0.name', 'Terraza')
            ->has('zones.0.tables', 1)
            ->where('zones.0.tables.0.order', null)
            ->where('thresholds.warn', 10)
            ->where('thresholds.alert', 20));
});

it('marks a table as occupied with its account and waiting time', function () {
    $this->actingAs($this->waiter)->post(route('orders.store'), [
        'client_id' => (string) Str::uuid(),
        'type' => 'dine_in',
        'table_ids' => [$this->table->id],
        'items' => [['variant_id' => ProductVariant::factory()->create()->id, 'quantity' => 2]],
    ]);

    $this->actingAs($this->waiter)
        ->get(route('floor.index'))
        ->assertInertia(fn ($page) => $page
            ->where('zones.0.tables.0.order.label', 'Mesa 7')
            ->where('zones.0.tables.0.order.items_count', 2)
            ->whereType('zones.0.tables.0.order.waiting_since', 'string'));
});

it('lists open orders without a table apart from the tables', function () {
    $this->actingAs($this->waiter)->post(route('orders.store'), [
        'client_id' => (string) Str::uuid(),
        'type' => 'takeaway',
        'items' => [['variant_id' => ProductVariant::factory()->create()->id, 'quantity' => 1]],
    ]);

    $this->actingAs($this->waiter)
        ->get(route('floor.index'))
        ->assertInertia(fn ($page) => $page
            ->has('loose_orders', 1)
            ->where('loose_orders.0.label', 'Para llevar #1'));
});

it('hides archived zones and tables from the floor', function () {
    $this->table->update(['is_active' => false]);

    $this->actingAs($this->waiter)
        ->get(route('floor.index'))
        ->assertInertia(fn ($page) => $page->has('zones.0.tables', 0));

    $this->zone->update(['is_active' => false]);

    $this->actingAs($this->waiter)
        ->get(route('floor.index'))
        ->assertInertia(fn ($page) => $page->has('zones', 0));
});

it('forbids the floor to kitchen staff', function () {
    $kitchen = User::factory()->for($this->branch)->create()->assignRole(Role::Kitchen->value);

    $this->actingAs($kitchen)->get(route('floor.index'))->assertForbidden();
});

it('includes the account detail when an open order of the branch is requested', function () {
    $this->actingAs($this->waiter)->post(route('orders.store'), [
        'client_id' => (string) Str::uuid(),
        'type' => 'dine_in',
        'table_ids' => [$this->table->id],
        'items' => [['variant_id' => ProductVariant::factory()->create()->id, 'quantity' => 1]],
    ]);
    $order = Order::query()->firstOrFail();

    $this->actingAs($this->waiter)
        ->get(route('floor.index', ['order' => $order->id]))
        ->assertInertia(fn ($page) => $page
            ->where('detail.id', $order->id)
            ->has('detail.rounds', 1)
            ->has('table_options'));

    $this->actingAs($this->waiter)
        ->get(route('floor.index'))
        ->assertInertia(fn ($page) => $page->where('detail', null));
});

it('ignores the detail of an order from another branch', function () {
    $otherBranch = Branch::factory()->create();
    $otherWaiter = User::factory()->for($otherBranch)->create()->assignRole(Role::Waiter->value);
    $otherTable = DiningTable::factory()->inZone(Zone::factory()->create(['branch_id' => $otherBranch->id]))->create();
    $this->actingAs($otherWaiter)->post(route('orders.store'), [
        'client_id' => (string) Str::uuid(),
        'type' => 'dine_in',
        'table_ids' => [$otherTable->id],
        'items' => [['variant_id' => ProductVariant::factory()->create()->id, 'quantity' => 1]],
    ]);
    $foreign = Order::query()->firstOrFail();

    $this->actingAs($this->waiter)
        ->get(route('floor.index', ['order' => $foreign->id]))
        ->assertInertia(fn ($page) => $page->where('detail', null));
});
