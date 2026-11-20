<?php

use App\Enums\KitchenStage;
use App\Enums\Role;
use App\Events\FloorChanged;
use App\Events\KitchenTicketChanged;
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
use Illuminate\Broadcasting\BroadcastEvent;
use Illuminate\Broadcasting\BroadcastManager;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;

beforeEach(function () {
    $this->seed(RoleSeeder::class);
    $this->branch = Branch::factory()->create();
    $this->waiter = User::factory()->for($this->branch)->create()->assignRole(Role::Waiter->value);
    $this->cook = User::factory()->for($this->branch)->create()->assignRole(Role::Kitchen->value);
    $this->cashier = User::factory()->for($this->branch)->create()->assignRole(Role::Cashier->value);
    $this->admin = User::factory()->for($this->branch)->create()->assignRole(Role::Admin->value);

    $zone = Zone::factory()->create(['branch_id' => $this->branch->id]);
    $this->table = DiningTable::factory()->inZone($zone)->create(['name' => 'Mesa 1']);
    $this->spare = DiningTable::factory()->inZone($zone)->create(['name' => 'Mesa 2']);

    $food = Product::factory()->for(Category::factory()->create(['needs_kitchen' => true]))->create();
    $drink = Product::factory()->for(Category::factory()->create(['needs_kitchen' => false]))->create();
    $this->food = ProductVariant::factory()->for($food)->create(['price_cents' => 1800]);
    $this->drink = ProductVariant::factory()->for($drink)->create(['price_cents' => 400]);
});

function place($test, array $items): OrderRound
{
    $test->actingAs($test->waiter)->post(route('orders.store'), [
        'client_id' => (string) Str::uuid(),
        'type' => 'dine_in',
        'table_ids' => [$test->table->id],
        'items' => $items,
    ]);

    return OrderRound::latest('id')->firstOrFail();
}

function foodItems($test): array
{
    return [['variant_id' => $test->food->id, 'quantity' => 1]];
}

it('announces a new kitchen ticket and a floor change when a round is sent', function () {
    Event::fake([FloorChanged::class, KitchenTicketChanged::class]);

    $round = place($this, foodItems($this));

    Event::assertDispatched(KitchenTicketChanged::class, fn (KitchenTicketChanged $event) => $event->kind === KitchenTicketChanged::NEW
        && $event->roundId === $round->id
        && $event->label === 'Mesa 1'
        && $event->branchId === $this->branch->id
        && $event->waiterId === $this->waiter->id);
    Event::assertDispatched(FloorChanged::class, fn (FloorChanged $event) => $event->reason === 'round_sent');
});

it('does not announce drink-only rounds to the kitchen', function () {
    Event::fake([FloorChanged::class, KitchenTicketChanged::class]);

    place($this, [['variant_id' => $this->drink->id, 'quantity' => 1]]);

    Event::assertNotDispatched(KitchenTicketChanged::class);
    Event::assertDispatched(FloorChanged::class);
});

it('announces each kitchen stage with its label', function () {
    $round = place($this, foodItems($this));
    Event::fake([KitchenTicketChanged::class]);

    $this->actingAs($this->cook)->patch(route('rounds.kitchen', $round), ['stage' => KitchenStage::Received->value]);
    $this->actingAs($this->cook)->patch(route('rounds.kitchen', $round), ['stage' => KitchenStage::Preparing->value]);

    Event::assertDispatched(KitchenTicketChanged::class, fn (KitchenTicketChanged $event) => $event->kind === KitchenTicketChanged::STAGE
        && $event->stage === KitchenStage::Preparing->value
        && $event->stageLabel === 'Preparando');
});

it('tells the kitchen when a round or a kitchen dish is cancelled', function () {
    $round = place($this, [...foodItems($this), ['variant_id' => $this->drink->id, 'quantity' => 1]]);
    $food = $round->items()->where('needs_kitchen', true)->firstOrFail();
    $drink = $round->items()->where('needs_kitchen', false)->firstOrFail();
    Event::fake([KitchenTicketChanged::class]);

    $this->actingAs($this->waiter)->patch(route('items.cancel', $drink));
    Event::assertDispatched(KitchenTicketChanged::class, fn ($event) => $event->kind === KitchenTicketChanged::UPDATED);

    $this->actingAs($this->waiter)->patch(route('items.cancel', $food));
    Event::assertDispatched(KitchenTicketChanged::class, fn ($event) => $event->kind === KitchenTicketChanged::ITEM_CANCELLED);
});

it('tells the kitchen when a whole account is cancelled', function () {
    place($this, foodItems($this));
    $order = Order::firstOrFail();
    Event::fake([FloorChanged::class, KitchenTicketChanged::class]);

    $this->actingAs($this->waiter)->patch(route('orders.cancel', $order));

    Event::assertDispatched(KitchenTicketChanged::class, fn ($event) => $event->kind === KitchenTicketChanged::CANCELLED);
    Event::assertDispatched(FloorChanged::class, fn ($event) => $event->reason === 'order_cancelled');
});

it('refreshes the floor and cash when tables, payments, cash or the menu change', function () {
    Event::fake([FloorChanged::class]);

    $this->actingAs($this->cashier)->post(route('cash.sessions.store'), ['opening' => '100']);
    Event::assertDispatched(FloorChanged::class, fn ($event) => $event->reason === 'cash');

    $this->actingAs($this->admin)->post(route('zones.store'), ['branch_id' => $this->branch->id, 'name' => 'Terraza']);
    Event::assertDispatched(FloorChanged::class, fn ($event) => $event->reason === 'tables');

    Branch::factory()->create();
    $product = Product::firstOrFail();
    $this->actingAs($this->admin)->patch(route('menu.availability', $product), ['is_available' => false]);

    Event::assertDispatchedTimes(FloorChanged::class, 1 + 1 + Branch::count());
});

it('refreshes the floor when a payment is made', function () {
    $this->actingAs($this->cashier)->post(route('cash.sessions.store'), ['opening' => '100']);
    place($this, foodItems($this));
    $order = Order::firstOrFail();
    Event::fake([FloorChanged::class]);

    $this->actingAs($this->cashier)->post(route('orders.payments.store', $order), [
        'client_id' => (string) Str::uuid(),
        'method' => 'cash',
        'amount' => '18',
    ]);

    Event::assertDispatched(FloorChanged::class, fn ($event) => $event->reason === 'payment' && $event->orderId === $order->id);
});

it('broadcasts on private channels of the branch and never leaks amounts', function () {
    $floor = new FloorChanged(7, 'payment', 3);
    $ticket = new KitchenTicketChanged(7, 1, 3, 9, 'Mesa 1', KitchenTicketChanged::NEW, 0, 'Nuevo');

    expect(collect($floor->broadcastOn())->map->name->all())->toBe(['private-branch.7.floor', 'private-branch.7.cash'])
        ->and($floor->broadcastAs())->toBe('floor.changed')
        ->and($floor->broadcastWith())->toBe(['reason' => 'payment', 'order_id' => 3])
        ->and(collect($ticket->broadcastOn())->map->name->all())->toBe(['private-branch.7.kitchen', 'private-branch.7.floor'])
        ->and($ticket->broadcastAs())->toBe('kitchen.ticket')
        ->and(array_keys($ticket->broadcastWith()))->not->toContain('total_cents');
});

it('sends broadcasts through the queue instead of blocking the request', function () {
    Queue::fake();

    place($this, foodItems($this));

    Queue::assertPushed(BroadcastEvent::class, fn (BroadcastEvent $job) => $job->event instanceof KitchenTicketChanged);
    Queue::assertPushed(BroadcastEvent::class, fn (BroadcastEvent $job) => $job->event instanceof FloorChanged);
});

function authorizeChannel($test, ?User $user, string $channel)
{
    config([
        'broadcasting.default' => 'reverb',
        'broadcasting.connections.reverb.key' => 'test-key',
        'broadcasting.connections.reverb.secret' => 'test-secret',
        'broadcasting.connections.reverb.app_id' => 'test-app',
    ]);
    app(BroadcastManager::class)->purge('reverb');
    require base_path('routes/channels.php');

    if ($user === null) {
        auth()->forgetGuards();
    }

    $request = $user ? $test->actingAs($user) : $test;

    return $request->post('/broadcasting/auth', ['socket_id' => '1234.5678', 'channel_name' => "private-{$channel}"]);
}

it('authorizes each role only on the channels it needs in its own branch', function () {
    $id = $this->branch->id;

    authorizeChannel($this, $this->waiter, "branch.{$id}.floor")->assertOk();
    authorizeChannel($this, $this->cook, "branch.{$id}.kitchen")->assertOk();
    authorizeChannel($this, $this->cashier, "branch.{$id}.cash")->assertOk();
    authorizeChannel($this, $this->admin, "branch.{$id}.kitchen")->assertOk();

    authorizeChannel($this, $this->waiter, "branch.{$id}.kitchen")->assertForbidden();
    authorizeChannel($this, $this->waiter, "branch.{$id}.cash")->assertForbidden();
    authorizeChannel($this, $this->cook, "branch.{$id}.floor")->assertForbidden();
});

it('denies channels of another branch and to guests', function () {
    $other = Branch::factory()->create();

    authorizeChannel($this, $this->waiter, "branch.{$other->id}.floor")->assertForbidden();
    authorizeChannel($this, $this->cashier, "branch.{$other->id}.cash")->assertForbidden();
    authorizeChannel($this, null, "branch.{$this->branch->id}.floor")->assertForbidden();
});
