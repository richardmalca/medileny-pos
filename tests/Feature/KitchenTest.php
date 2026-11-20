<?php

use App\Enums\KitchenStage;
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
    $this->branch = Branch::factory()->create(['change_window_minutes' => 10]);
    $this->waiter = User::factory()->for($this->branch)->create()->assignRole(Role::Waiter->value);
    $this->cook = User::factory()->for($this->branch)->create()->assignRole(Role::Kitchen->value);
    $this->admin = User::factory()->for($this->branch)->create()->assignRole(Role::Admin->value);

    $zone = Zone::factory()->create(['branch_id' => $this->branch->id]);
    $this->table = DiningTable::factory()->inZone($zone)->create(['name' => 'Mesa 1']);
    $this->other = DiningTable::factory()->inZone($zone)->create(['name' => 'Mesa 2']);

    $food = Product::factory()->for(Category::factory()->create(['needs_kitchen' => true]))->create();
    $drink = Product::factory()->for(Category::factory()->create(['needs_kitchen' => false]))->create();
    $this->food = ProductVariant::factory()->for($food)->create(['price_cents' => 1800]);
    $this->drink = ProductVariant::factory()->for($drink)->create(['price_cents' => 400]);
});

function sendRound($test, array $items, ?DiningTable $table = null, ?User $as = null): OrderRound
{
    $test->actingAs($as ?? $test->waiter)->post(route('orders.store'), [
        'client_id' => (string) Str::uuid(),
        'type' => 'dine_in',
        'table_ids' => [($table ?? $test->table)->id],
        'items' => $items,
    ]);

    return OrderRound::latest('id')->firstOrFail();
}

function advance($test, OrderRound $round, KitchenStage $stage, ?User $as = null)
{
    return $test->actingAs($as ?? $test->cook)->patch(route('rounds.kitchen', $round), ['stage' => $stage->value]);
}

it('shows the kitchen screen only to kitchen staff and the admin', function () {
    $this->actingAs($this->cook)->get(route('kitchen.index'))->assertOk()
        ->assertInertia(fn ($page) => $page->component('kitchen/index')->has('tickets', 0)->has('thresholds'));

    $this->actingAs($this->admin)->get(route('kitchen.index'))->assertOk();
    $this->actingAs($this->waiter)->get(route('kitchen.index'))->assertForbidden();
});

it('lists rounds with kitchen items and hides drink-only rounds and other branches', function () {
    sendRound($this, [['variant_id' => $this->food->id, 'quantity' => 2, 'note' => 'sin ají'], ['variant_id' => $this->drink->id, 'quantity' => 1]]);
    sendRound($this, [['variant_id' => $this->drink->id, 'quantity' => 1]], $this->other);

    $stranger = User::factory()->for(Branch::factory())->create()->assignRole(Role::Waiter->value);
    $foreignTable = DiningTable::factory()->create(['branch_id' => $stranger->branch_id]);
    sendRound($this, [['variant_id' => $this->food->id, 'quantity' => 1]], $foreignTable, $stranger);

    $this->actingAs($this->cook)
        ->get(route('kitchen.index'))
        ->assertInertia(fn ($page) => $page
            ->has('tickets', 1)
            ->where('tickets.0.label', 'Mesa 1')
            ->where('tickets.0.stage', 0)
            ->where('tickets.0.next_label', 'Recibido')
            ->has('tickets.0.items', 1)
            ->where('tickets.0.items.0.note', 'sin ají')
            ->where('tickets.0.waiter_name', $this->waiter->name));
});

it('moves a round through every kitchen stage and stamps each one', function () {
    $round = sendRound($this, [['variant_id' => $this->food->id, 'quantity' => 1]]);

    foreach ([KitchenStage::Received, KitchenStage::Preparing, KitchenStage::Ready, KitchenStage::Handed] as $stage) {
        advance($this, $round, $stage)->assertRedirect();
    }

    $round->refresh();

    expect($round->received_at)->not->toBeNull()
        ->and($round->preparing_at)->not->toBeNull()
        ->and($round->ready_at)->not->toBeNull()
        ->and($round->handed_at)->not->toBeNull()
        ->and($round->kitchen_user_id)->toBe($this->cook->id)
        ->and(KitchenStage::of($round))->toBe(KitchenStage::Handed);
});

it('does not let a stage be skipped or repeated', function () {
    $round = sendRound($this, [['variant_id' => $this->food->id, 'quantity' => 1]]);

    advance($this, $round, KitchenStage::Ready)->assertSessionHasErrors('stage');
    advance($this, $round, KitchenStage::Received);
    advance($this, $round, KitchenStage::Received)->assertSessionHasErrors('stage');

    expect(KitchenStage::of($round->refresh()))->toBe(KitchenStage::Received);
});

it('goes back one stage and clears its timestamp so a tap can be undone', function () {
    $round = sendRound($this, [['variant_id' => $this->food->id, 'quantity' => 1]]);
    advance($this, $round, KitchenStage::Received);
    advance($this, $round, KitchenStage::Preparing);

    advance($this, $round, KitchenStage::Received)->assertRedirect();

    $round->refresh();

    expect($round->preparing_at)->toBeNull()
        ->and($round->received_at)->not->toBeNull()
        ->and(KitchenStage::of($round))->toBe(KitchenStage::Received);
});

it('rejects invalid stages and users who cannot use the kitchen', function () {
    $round = sendRound($this, [['variant_id' => $this->food->id, 'quantity' => 1]]);

    $this->actingAs($this->cook)->patch(route('rounds.kitchen', $round), ['stage' => 9])->assertSessionHasErrors('stage');
    advance($this, $round, KitchenStage::Received, $this->waiter)->assertForbidden();

    $strangerCook = User::factory()->for(Branch::factory())->create()->assignRole(Role::Kitchen->value);
    advance($this, $round, KitchenStage::Received, $strangerCook)->assertForbidden();
});

it('keeps handed rounds visible for an hour and then hides them', function () {
    $round = sendRound($this, [['variant_id' => $this->food->id, 'quantity' => 1]]);

    foreach ([KitchenStage::Received, KitchenStage::Preparing, KitchenStage::Ready, KitchenStage::Handed] as $stage) {
        advance($this, $round, $stage);
    }

    $this->actingAs($this->cook)->get(route('kitchen.index'))->assertInertia(fn ($page) => $page->has('tickets', 1));

    $this->travel(61)->minutes();

    $this->actingAs($this->cook)->get(route('kitchen.index'))->assertInertia(fn ($page) => $page->has('tickets', 0));
});

it('flags a cancelled round the kitchen already received, for fifteen minutes', function () {
    $round = sendRound($this, [['variant_id' => $this->food->id, 'quantity' => 1]]);
    advance($this, $round, KitchenStage::Received);

    $this->actingAs($this->admin)->patch(route('rounds.cancel', $round));

    $this->actingAs($this->cook)
        ->get(route('kitchen.index'))
        ->assertInertia(fn ($page) => $page->has('tickets', 1)->whereType('tickets.0.cancelled_at', 'string')->where('tickets.0.can_update', false));

    $this->travel(16)->minutes();

    $this->actingAs($this->cook)->get(route('kitchen.index'))->assertInertia(fn ($page) => $page->has('tickets', 0));
});

it('never shows a cancelled round the kitchen did not receive', function () {
    $round = sendRound($this, [['variant_id' => $this->food->id, 'quantity' => 1]]);

    $this->actingAs($this->waiter)->patch(route('rounds.cancel', $round));

    $this->actingAs($this->cook)->get(route('kitchen.index'))->assertInertia(fn ($page) => $page->has('tickets', 0));
});

it('shows the kitchen status to the waiter on the floor and on the account', function () {
    $round = sendRound($this, [['variant_id' => $this->food->id, 'quantity' => 1]]);
    advance($this, $round, KitchenStage::Received);
    advance($this, $round, KitchenStage::Preparing);

    $this->actingAs($this->waiter)
        ->get(route('floor.index'))
        ->assertInertia(fn ($page) => $page
            ->where('zones.0.tables.0.order.kitchen_stage', 2)
            ->where('zones.0.tables.0.order.kitchen_label', 'Preparando'));

    advance($this, $round, KitchenStage::Ready);

    $this->actingAs($this->waiter)
        ->get(route('orders.show', Order::firstOrFail()))
        ->assertInertia(fn ($page) => $page
            ->where('order.kitchen_stage', 3)
            ->where('order.rounds.0.kitchen_label', 'Listo')
            ->whereType('order.rounds.0.ready_at', 'string'));
});

it('prioritizes a ready round over one still being prepared and ignores handed ones', function () {
    $first = sendRound($this, [['variant_id' => $this->food->id, 'quantity' => 1]]);
    $order = Order::firstOrFail();
    $this->actingAs($this->waiter)->post(route('orders.rounds.store', $order), [
        'client_id' => (string) Str::uuid(),
        'items' => [['variant_id' => $this->food->id, 'quantity' => 1]],
    ]);
    $second = OrderRound::latest('id')->firstOrFail();

    advance($this, $first, KitchenStage::Received);
    advance($this, $first, KitchenStage::Preparing);
    advance($this, $second, KitchenStage::Received);
    advance($this, $first, KitchenStage::Ready);

    expect($order->fresh(['activeRounds.items'])->kitchenAttention())->toBe(KitchenStage::Ready);

    advance($this, $first, KitchenStage::Handed);

    expect($order->fresh(['activeRounds.items'])->kitchenAttention())->toBe(KitchenStage::Received);
});

it('has no kitchen status for a drink-only round', function () {
    sendRound($this, [['variant_id' => $this->drink->id, 'quantity' => 1]]);

    expect(OrderRound::firstOrFail()->load('items')->kitchenStage())->toBeNull();
});

it('counts the change window from the moment the kitchen starts preparing', function () {
    $round = sendRound($this, [['variant_id' => $this->food->id, 'quantity' => 1]]);
    $item = $round->items()->firstOrFail();

    $this->travel(9)->minutes();
    advance($this, $round, KitchenStage::Received);
    advance($this, $round, KitchenStage::Preparing);

    $this->travel(5)->minutes();

    $this->actingAs($this->waiter)->patch(route('items.cancel', $item))->assertRedirect();
});

it('locks kitchen items as soon as they are ready, even inside the window', function () {
    $round = sendRound($this, [['variant_id' => $this->food->id, 'quantity' => 2]]);
    $item = $round->items()->firstOrFail();

    advance($this, $round, KitchenStage::Received);
    advance($this, $round, KitchenStage::Preparing);
    advance($this, $round, KitchenStage::Ready);

    $this->actingAs($this->waiter)->patch(route('items.cancel', $item))->assertForbidden();

    advance($this, $round, KitchenStage::Preparing);

    $this->actingAs($this->waiter)->patch(route('items.cancel', $item))->assertRedirect();
});
