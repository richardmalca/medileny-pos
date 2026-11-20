<?php

use App\Enums\OrderStatus;
use App\Enums\Role;
use App\Models\Branch;
use App\Models\Category;
use App\Models\DiningTable;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use App\Models\Zone;
use Database\Seeders\RoleSeeder;
use Illuminate\Support\Str;

beforeEach(function () {
    $this->seed(RoleSeeder::class);
    $this->branch = Branch::factory()->create(['change_window_minutes' => 10]);
    $this->waiter = User::factory()->for($this->branch)->create()->assignRole(Role::Waiter->value);
    $this->cashier = User::factory()->for($this->branch)->create()->assignRole(Role::Cashier->value);
    $this->admin = User::factory()->for($this->branch)->create()->assignRole(Role::Admin->value);

    $zone = Zone::factory()->create(['branch_id' => $this->branch->id]);
    $this->tableA = DiningTable::factory()->inZone($zone)->create(['name' => 'Mesa A']);
    $this->tableB = DiningTable::factory()->inZone($zone)->create(['name' => 'Mesa B']);
    $this->tableC = DiningTable::factory()->inZone($zone)->create(['name' => 'Mesa C']);

    $food = Product::factory()->for(Category::factory()->create(['needs_kitchen' => true]))->create();
    $drink = Product::factory()->for(Category::factory()->create(['needs_kitchen' => false]))->create();
    $this->food = ProductVariant::factory()->for($food)->create(['price_cents' => 1800]);
    $this->drink = ProductVariant::factory()->for($drink)->create(['price_cents' => 400]);
});

function placeOrder($test, array $overrides = []): Order
{
    $test->actingAs($test->waiter)->post(route('orders.store'), [
        'client_id' => (string) Str::uuid(),
        'type' => 'dine_in',
        'table_ids' => [$test->tableA->id],
        'items' => [
            ['variant_id' => $test->food->id, 'quantity' => 2],
            ['variant_id' => $test->drink->id, 'quantity' => 1],
        ],
        ...$overrides,
    ]);

    return Order::latest('id')->firstOrFail();
}

function itemOf(Order $order, bool $kitchen): OrderItem
{
    return $order->items()->where('needs_kitchen', $kitchen)->firstOrFail();
}

it('snapshots whether each item needs the kitchen', function () {
    $order = placeOrder($this);

    expect(itemOf($order, true)->needs_kitchen)->toBeTrue()
        ->and(itemOf($order, false)->needs_kitchen)->toBeFalse();
});

it('lets any waiter of the branch remove a kitchen item inside the change window', function () {
    $order = placeOrder($this);
    $item = itemOf($order, true);
    $colleague = User::factory()->for($this->branch)->create()->assignRole(Role::Waiter->value);

    $this->travel(9)->minutes();
    $this->actingAs($colleague)->patch(route('items.cancel', $item))->assertRedirect();

    expect($item->refresh()->cancelled_at)->not->toBeNull()
        ->and($order->refresh()->total_cents)->toBe(400)
        ->and($order->status)->toBe(OrderStatus::Open);
});

it('stops changing kitchen items after the window, except for the admin', function () {
    $order = placeOrder($this);
    $item = itemOf($order, true);

    $this->travel(11)->minutes();

    $this->actingAs($this->waiter)->patch(route('items.cancel', $item))->assertForbidden();
    $this->actingAs($this->cashier)->patch(route('items.cancel', $item))->assertForbidden();
    $this->actingAs($this->admin)->patch(route('items.cancel', $item))->assertRedirect();

    expect($item->refresh()->cancelled_at)->not->toBeNull();
});

it('lets a drink be changed after the window until it is served', function () {
    $order = placeOrder($this);
    $drink = itemOf($order, false);

    $this->travel(40)->minutes();

    $this->actingAs($this->waiter)->patch(route('items.cancel', $drink))->assertRedirect();
    expect($drink->refresh()->cancelled_at)->not->toBeNull();
});

it('blocks changing a drink once it was served, except for the admin', function () {
    $order = placeOrder($this);
    $drink = itemOf($order, false);

    $this->actingAs($this->waiter)
        ->patch(route('orders.served', $order), ['served' => true, 'item_ids' => [$drink->id]])
        ->assertRedirect();

    $this->actingAs($this->waiter)->patch(route('items.cancel', $drink))->assertForbidden();
    $this->actingAs($this->admin)->patch(route('items.cancel', $drink))->assertRedirect();
});

it('uses the change window configured for the branch', function () {
    $this->branch->update(['change_window_minutes' => 20]);
    $order = placeOrder($this);
    $item = itemOf($order, true);

    $this->travel(15)->minutes();

    $this->actingAs($this->waiter)->patch(route('items.cancel', $item))->assertRedirect();
});

it('cancels the account and frees the tables when the last item is removed', function () {
    $order = placeOrder($this, ['items' => [['variant_id' => $this->food->id, 'quantity' => 1]]]);

    $this->actingAs($this->waiter)->patch(route('items.cancel', $order->items()->firstOrFail()));

    expect($order->refresh()->status)->toBe(OrderStatus::Cancelled)
        ->and(DiningTable::find($this->tableA->id)->openOrders()->exists())->toBeFalse();
});

it('restores a removed item inside the undo window but not after', function () {
    $order = placeOrder($this);
    $item = itemOf($order, true);
    $this->actingAs($this->waiter)->patch(route('items.cancel', $item));

    $this->actingAs($this->waiter)->patch(route('items.restore', $item))->assertRedirect();
    expect($item->refresh()->cancelled_at)->toBeNull()->and($order->refresh()->total_cents)->toBe(4000);

    $this->actingAs($this->waiter)->patch(route('items.cancel', $item));
    $this->travel(11)->minutes();

    $this->actingAs($this->waiter)->patch(route('items.restore', $item))->assertForbidden();
    $this->actingAs($this->admin)->patch(route('items.restore', $item))->assertRedirect();
});

it('marks items as served and unserved in bulk', function () {
    $order = placeOrder($this);
    $ids = $order->items()->pluck('id')->all();

    $this->actingAs($this->waiter)
        ->patch(route('orders.served', $order), ['served' => true, 'item_ids' => $ids])
        ->assertRedirect();

    expect($order->items()->whereNull('served_at')->count())->toBe(0);

    $this->actingAs($this->waiter)
        ->patch(route('orders.served', $order), ['served' => false, 'item_ids' => $ids]);

    expect($order->items()->whereNotNull('served_at')->count())->toBe(0);
});

it('rejects serving items of another order or by kitchen staff', function () {
    $order = placeOrder($this);
    $other = placeOrder($this, ['table_ids' => [$this->tableB->id]]);

    $this->actingAs($this->waiter)
        ->patch(route('orders.served', $order), ['served' => true, 'item_ids' => [$other->items()->firstOrFail()->id]])
        ->assertSessionHasErrors('item_ids.0');

    $kitchen = User::factory()->for($this->branch)->create()->assignRole(Role::Kitchen->value);

    $this->actingAs($kitchen)
        ->patch(route('orders.served', $order), ['served' => true, 'item_ids' => [$order->items()->firstOrFail()->id]])
        ->assertForbidden();
});

it('lets the waiter cancel an account while everything can still be changed', function () {
    $order = placeOrder($this);

    $this->actingAs($this->waiter)->patch(route('orders.cancel', $order))->assertRedirect();

    expect($order->refresh()->status)->toBe(OrderStatus::Cancelled)
        ->and(DiningTable::find($this->tableA->id)->openOrders()->exists())->toBeFalse();
});

it('keeps the waiter from cancelling an account once the kitchen window has passed', function () {
    $order = placeOrder($this);

    $this->travel(11)->minutes();

    $this->actingAs($this->waiter)->patch(route('orders.cancel', $order))->assertForbidden();
    $this->actingAs($this->admin)->patch(route('orders.cancel', $order))->assertRedirect();

    expect($order->refresh()->status)->toBe(OrderStatus::Cancelled);
});

it('restores a cancelled account unless its tables were taken meanwhile', function () {
    $order = placeOrder($this);
    $this->actingAs($this->waiter)->patch(route('orders.cancel', $order));

    $this->actingAs($this->waiter)->patch(route('orders.restore', $order))->assertRedirect();
    expect($order->refresh()->status)->toBe(OrderStatus::Open);

    $this->actingAs($this->waiter)->patch(route('orders.cancel', $order));
    placeOrder($this);

    $this->actingAs($this->waiter)
        ->patch(route('orders.restore', $order))
        ->assertSessionHasErrors('table_ids');
});

it('moves the account to other free tables and joins more of them', function () {
    $order = placeOrder($this);

    $this->actingAs($this->waiter)
        ->patch(route('orders.tables.update', $order), ['table_ids' => [$this->tableB->id]])
        ->assertRedirect();

    expect($order->tables()->pluck('dining_tables.id')->all())->toBe([$this->tableB->id])
        ->and(DiningTable::find($this->tableA->id)->openOrders()->exists())->toBeFalse();

    $this->actingAs($this->waiter)
        ->patch(route('orders.tables.update', $order), ['table_ids' => [$this->tableB->id, $this->tableC->id]]);

    expect($order->tables()->count())->toBe(2);
});

it('does not move an account to a table that someone else occupies', function () {
    $order = placeOrder($this);
    placeOrder($this, ['table_ids' => [$this->tableB->id]]);

    $this->actingAs($this->waiter)
        ->patch(route('orders.tables.update', $order), ['table_ids' => [$this->tableB->id]])
        ->assertSessionHasErrors('table_ids');

    expect($order->tables()->pluck('dining_tables.id')->all())->toBe([$this->tableA->id]);
});

it('lets a takeaway customer free the table but requires a table for dine in', function () {
    $takeaway = placeOrder($this, ['type' => 'takeaway']);

    $this->actingAs($this->waiter)
        ->patch(route('orders.tables.update', $takeaway), ['table_ids' => []])
        ->assertSessionDoesntHaveErrors();

    expect($takeaway->tables()->count())->toBe(0);

    $dineIn = placeOrder($this, ['table_ids' => [$this->tableB->id]]);

    $this->actingAs($this->waiter)
        ->patch(route('orders.tables.update', $dineIn), ['table_ids' => []])
        ->assertSessionHasErrors('table_ids');
});

it('rejects tables for delivery and tables from another branch', function () {
    $delivery = placeOrder($this, [
        'type' => 'delivery',
        'table_ids' => [],
        'customer_name' => 'Rosa',
        'customer_phone' => '987654321',
        'delivery_address' => 'Jr. Lima 123',
    ]);

    $this->actingAs($this->waiter)
        ->patch(route('orders.tables.update', $delivery), ['table_ids' => [$this->tableB->id]])
        ->assertSessionHasErrors('table_ids');

    $order = placeOrder($this);
    $foreign = DiningTable::factory()->create();

    $this->actingAs($this->waiter)
        ->patch(route('orders.tables.update', $order), ['table_ids' => [$foreign->id]])
        ->assertSessionHasErrors('table_ids.0');
});

it('exposes what can still be changed on the account page', function () {
    $order = placeOrder($this);
    $this->travel(11)->minutes();

    $this->actingAs($this->waiter)
        ->get(route('orders.show', $order))
        ->assertInertia(fn ($page) => $page
            ->component('orders/show')
            ->where('order.change_window_minutes', 10)
            ->where('order.can_cancel', false)
            ->where('order.can_move_tables', true)
            ->has('table_options', 1)
            ->where('order.rounds.0.items', fn ($items) => collect($items)->every(
                fn ($item) => $item['needs_kitchen']
                    ? $item['can_cancel'] === false && $item['changeable_until'] !== null
                    : $item['can_cancel'] === true && $item['changeable_until'] === null,
            )));
});

it('does not join tables from different zones', function () {
    $terrace = DiningTable::factory()
        ->inZone(Zone::factory()->create(['branch_id' => $this->branch->id, 'name' => 'Terraza']))
        ->create(['name' => 'Mesa T']);

    $this->actingAs($this->waiter)->post(route('orders.store'), [
        'client_id' => (string) Str::uuid(),
        'type' => 'dine_in',
        'table_ids' => [$this->tableA->id, $terrace->id],
        'items' => [['variant_id' => $this->food->id, 'quantity' => 1]],
    ])->assertSessionHasErrors('table_ids');

    expect(Order::count())->toBe(0);

    $order = placeOrder($this);

    $this->actingAs($this->waiter)
        ->patch(route('orders.tables.update', $order), ['table_ids' => [$this->tableA->id, $terrace->id]])
        ->assertSessionHasErrors('table_ids');

    expect($order->tables()->pluck('dining_tables.id')->all())->toBe([$this->tableA->id]);

    $this->actingAs($this->waiter)
        ->patch(route('orders.tables.update', $order), ['table_ids' => [$terrace->id]])
        ->assertSessionHasNoErrors();
});
