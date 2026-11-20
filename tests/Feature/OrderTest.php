<?php

use App\Enums\OrderStatus;
use App\Enums\Role;
use App\Models\Branch;
use App\Models\Category;
use App\Models\DiningTable;
use App\Models\Order;
use App\Models\OrderRound;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use App\Models\Zone;
use Database\Seeders\RoleSeeder;
use Illuminate\Support\Str;

beforeEach(function () {
    $this->seed(RoleSeeder::class);
    $this->branch = Branch::factory()->create();
    $this->waiter = User::factory()->for($this->branch)->create()->assignRole(Role::Waiter->value);

    $zone = Zone::factory()->create(['branch_id' => $this->branch->id, 'name' => 'Primer piso']);
    $this->table1 = DiningTable::factory()->inZone($zone)->create(['name' => 'Mesa 1']);
    $this->table3 = DiningTable::factory()->inZone($zone)->create(['name' => 'Mesa 3']);
    $this->table5 = DiningTable::factory()->inZone($zone)->create(['name' => 'Mesa 5']);

    $product = Product::factory()->for(Category::factory())->create(['name' => 'Pollo a la brasa']);
    $this->quarter = ProductVariant::factory()->for($product)->create(['name' => '1/4', 'price_cents' => 1800]);
    $this->half = ProductVariant::factory()->for($product)->create(['name' => '1/2', 'price_cents' => 3300]);
});

function orderData($test, array $overrides = []): array
{
    return [
        'client_id' => (string) Str::uuid(),
        'type' => 'dine_in',
        'table_ids' => [$test->table5->id],
        'items' => [
            ['variant_id' => $test->quarter->id, 'quantity' => 2, 'note' => 'sin ensalada'],
            ['variant_id' => $test->half->id, 'quantity' => 1],
        ],
        ...$overrides,
    ];
}

function roundData($test, array $overrides = []): array
{
    return [
        'client_id' => (string) Str::uuid(),
        'items' => [['variant_id' => $test->quarter->id, 'quantity' => 1]],
        ...$overrides,
    ];
}

function openOrder($test, array $overrides = []): Order
{
    $test->actingAs($test->waiter)->post(route('orders.store'), orderData($test, $overrides));

    return Order::latest('id')->firstOrFail();
}

it('renders the sell screen with the chosen free tables', function () {
    $this->actingAs($this->waiter)
        ->get(route('orders.create', ['tables' => [$this->table5->id, $this->table1->id]]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('orders/create')
            ->has('categories', 1)
            ->has('tables', 2)
            ->where('order', null));
});

it('sends the waiter back to the floor when a chosen table is taken', function () {
    openOrder($this);

    $this->actingAs($this->waiter)
        ->get(route('orders.create', ['tables' => [$this->table5->id]]))
        ->assertRedirect(route('floor.index'));
});

it('forbids selling to kitchen staff', function () {
    $kitchen = User::factory()->for($this->branch)->create()->assignRole(Role::Kitchen->value);

    $this->actingAs($kitchen)->get(route('orders.create'))->assertForbidden();
    $this->actingAs($kitchen)->post(route('orders.store'), orderData($this))->assertForbidden();
});

it('opens an account with price snapshots and the total in cents', function () {
    $this->actingAs($this->waiter)
        ->post(route('orders.store'), orderData($this))
        ->assertRedirect(route('floor.index'));

    $order = Order::with('items')->firstOrFail();

    expect($order->status)->toBe(OrderStatus::Open)
        ->and($order->total_cents)->toBe(6900)
        ->and($order->branch_id)->toBe($this->branch->id)
        ->and($order->number)->toBe(1)
        ->and($order->items)->toHaveCount(2)
        ->and($order->items->first()->unit_price_cents)->toBe(1800)
        ->and($order->items->first()->note)->toBe('sin ensalada')
        ->and($order->rounds)->toHaveCount(1);
});

it('lets one account take several joined tables', function () {
    $order = openOrder($this, ['table_ids' => [$this->table5->id, $this->table1->id, $this->table3->id]]);

    expect($order->tables->pluck('name')->sort()->values()->all())->toBe(['Mesa 1', 'Mesa 3', 'Mesa 5']);
});

it('keeps old orders at their original price after the menu changes', function () {
    $order = openOrder($this);

    $this->quarter->update(['price_cents' => 2500]);

    expect($order->items()->first()->unit_price_cents)->toBe(1800);
});

it('does not duplicate an order when the same client id is sent twice', function () {
    $data = orderData($this);

    $this->actingAs($this->waiter)->post(route('orders.store'), $data);
    $this->actingAs($this->waiter)->post(route('orders.store'), $data);

    expect(Order::count())->toBe(1)->and(OrderRound::count())->toBe(1);
});

it('numbers orders per branch and day', function () {
    openOrder($this, ['type' => 'takeaway', 'table_ids' => []]);
    openOrder($this, ['type' => 'takeaway', 'table_ids' => []]);

    $other = User::factory()->for(Branch::factory())->create()->assignRole(Role::Waiter->value);
    $this->actingAs($other)->post(route('orders.store'), orderData($this, ['type' => 'takeaway', 'table_ids' => []]));

    expect(Order::orderBy('id')->pluck('number')->all())->toBe([1, 2, 1]);
});

it('requires tables for dine in and customer data for delivery', function () {
    $this->actingAs($this->waiter)
        ->post(route('orders.store'), orderData($this, ['table_ids' => []]))
        ->assertSessionHasErrors('table_ids');

    $this->actingAs($this->waiter)
        ->post(route('orders.store'), orderData($this, ['type' => 'delivery', 'table_ids' => []]))
        ->assertSessionHasErrors(['customer_name', 'customer_phone', 'delivery_address']);

    $this->actingAs($this->waiter)
        ->post(route('orders.store'), orderData($this, ['type' => 'takeaway', 'table_ids' => []]))
        ->assertSessionDoesntHaveErrors();
});

it('lets a takeaway customer wait on a table and occupy it', function () {
    $order = openOrder($this, ['type' => 'takeaway']);

    expect($order->tables)->toHaveCount(1)
        ->and(DiningTable::find($this->table5->id)->openOrders()->exists())->toBeTrue();
});

it('ignores tables on a delivery order', function () {
    $order = openOrder($this, [
        'type' => 'delivery',
        'customer_name' => 'Rosa',
        'customer_phone' => '987654321',
        'delivery_address' => 'Jr. Lima 123',
    ]);

    expect($order->tables)->toHaveCount(0)->and($order->delivery_address)->toBe('Jr. Lima 123');
});

it('rejects tables from another branch', function () {
    $foreign = DiningTable::factory()->create();

    $this->actingAs($this->waiter)
        ->post(route('orders.store'), orderData($this, ['table_ids' => [$foreign->id]]))
        ->assertSessionHasErrors('table_ids.0');
});

it('rejects a table that another waiter already took', function () {
    openOrder($this);

    $colleague = User::factory()->for($this->branch)->create()->assignRole(Role::Waiter->value);

    $this->actingAs($colleague)
        ->post(route('orders.store'), orderData($this))
        ->assertSessionHasErrors('table_ids');

    expect(Order::count())->toBe(1);
});

it('rejects empty orders and sold out products', function () {
    $this->actingAs($this->waiter)
        ->post(route('orders.store'), orderData($this, ['items' => []]))
        ->assertSessionHasErrors('items');

    $this->quarter->product->update(['is_available' => false]);

    $this->actingAs($this->waiter)
        ->post(route('orders.store'), orderData($this))
        ->assertSessionHasErrors('items.0.variant_id');

    expect(Order::count())->toBe(0);
});

it('flashes the id of the new round so it can be undone', function () {
    $this->actingAs($this->waiter)
        ->post(route('orders.store'), orderData($this))
        ->assertInertiaFlash('created_id', OrderRound::value('id'));
});

it('adds a new round to an open account and updates the total', function () {
    $order = openOrder($this);

    $this->actingAs($this->waiter)
        ->get(route('orders.rounds.create', $order))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('orders/create')->where('order.id', $order->id));

    $this->actingAs($this->waiter)
        ->post(route('orders.rounds.store', $order), roundData($this))
        ->assertRedirect(route('orders.show', $order));

    expect($order->refresh()->total_cents)->toBe(8700)->and($order->rounds()->count())->toBe(2);
});

it('does not add rounds to another branch or to a closed account', function () {
    $order = openOrder($this);
    $stranger = User::factory()->for(Branch::factory())->create()->assignRole(Role::Waiter->value);

    $this->actingAs($stranger)->post(route('orders.rounds.store', $order), roundData($this))->assertForbidden();

    $order->update(['status' => OrderStatus::Paid]);

    $this->actingAs($this->waiter)->post(route('orders.rounds.store', $order), roundData($this))->assertForbidden();
});

it('shows the account with its rounds and permissions', function () {
    $order = openOrder($this);

    $this->actingAs($this->waiter)
        ->get(route('orders.show', $order))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('orders/show')
            ->where('order.label', 'Mesa 5')
            ->has('order.rounds', 1)
            ->where('order.rounds.0.can_cancel', true)
            ->where('can_add', true)
            ->has('thresholds')
            ->has('server_now'));
});

it('cancels only one round and keeps the account open', function () {
    $order = openOrder($this);
    $this->actingAs($this->waiter)->post(route('orders.rounds.store', $order), roundData($this));
    $second = OrderRound::latest('id')->firstOrFail();

    $this->actingAs($this->waiter)->patch(route('rounds.cancel', $second))->assertRedirect();

    expect($second->refresh()->isCancelled())->toBeTrue()
        ->and($order->refresh()->status)->toBe(OrderStatus::Open)
        ->and($order->total_cents)->toBe(6900);
});

it('cancels the account and frees its tables when the last round is cancelled', function () {
    $order = openOrder($this);

    $this->actingAs($this->waiter)->patch(route('rounds.cancel', $order->rounds()->first()));

    expect($order->refresh()->status)->toBe(OrderStatus::Cancelled)
        ->and(DiningTable::find($this->table5->id)->openOrders()->exists())->toBeFalse();
});

it('restores a cancelled round and reopens the account', function () {
    $order = openOrder($this);
    $round = $order->rounds()->firstOrFail();

    $this->actingAs($this->waiter)->patch(route('rounds.cancel', $round));
    $this->actingAs($this->waiter)->patch(route('rounds.restore', $round))->assertRedirect();

    expect($order->refresh()->status)->toBe(OrderStatus::Open)
        ->and($order->total_cents)->toBe(6900)
        ->and($round->refresh()->isCancelled())->toBeFalse();
});

it('does not restore an account whose tables were taken meanwhile', function () {
    $order = openOrder($this);
    $round = $order->rounds()->firstOrFail();
    $this->actingAs($this->waiter)->patch(route('rounds.cancel', $round));

    openOrder($this);

    $this->actingAs($this->waiter)
        ->patch(route('rounds.restore', $round))
        ->assertSessionHasErrors('table_ids');

    expect($order->refresh()->status)->toBe(OrderStatus::Cancelled);
});

it('returns to the floor with the account open after adding from the workspace', function () {
    $order = openOrder($this);

    $this->actingAs($this->waiter)
        ->post(route('orders.rounds.store', $order), [...roundData($this), 'redirect' => 'floor'])
        ->assertRedirect(route('floor.index', ['order' => $order->id]));

    $this->actingAs($this->waiter)
        ->post(route('orders.rounds.store', $order), [...roundData($this), 'redirect' => 'elsewhere'])
        ->assertSessionHasErrors('redirect');
});
