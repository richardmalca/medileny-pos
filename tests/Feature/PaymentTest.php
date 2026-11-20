<?php

use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Enums\Role;
use App\Models\Branch;
use App\Models\CashSession;
use App\Models\Category;
use App\Models\DiningTable;
use App\Models\Order;
use App\Models\Payment;
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
    $this->cashier = User::factory()->for($this->branch)->create()->assignRole(Role::Cashier->value);
    $this->admin = User::factory()->for($this->branch)->create()->assignRole(Role::Admin->value);

    $zone = Zone::factory()->create(['branch_id' => $this->branch->id]);
    $this->table = DiningTable::factory()->inZone($zone)->create(['name' => 'Mesa 1']);
    $variant = ProductVariant::factory()->for(Product::factory()->for(Category::factory()))->create(['price_cents' => 2500]);

    $this->actingAs($this->waiter)->post(route('orders.store'), [
        'client_id' => (string) Str::uuid(),
        'type' => 'dine_in',
        'table_ids' => [$this->table->id],
        'items' => [['variant_id' => $variant->id, 'quantity' => 2]],
    ]);
    $this->order = Order::firstOrFail();
    $this->variant = $variant;
});

function openCash($test, string $opening = '100'): CashSession
{
    $test->actingAs($test->cashier)->post(route('cash.sessions.store'), ['opening' => $opening]);

    return CashSession::latest('id')->firstOrFail();
}

function pay($test, array $overrides = [], ?User $as = null)
{
    return $test->actingAs($as ?? $test->cashier)->post(route('orders.payments.store', $test->order), [
        'client_id' => (string) Str::uuid(),
        'method' => 'cash',
        'amount' => '50',
        ...$overrides,
    ]);
}

it('shows the checkout of an open account to the cashier', function () {
    openCash($this);

    $this->actingAs($this->cashier)
        ->get(route('orders.checkout', $this->order))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('orders/checkout')
            ->where('session_open', true)
            ->where('order.total_cents', 5000)
            ->where('order.remaining_cents', 5000)
            ->has('order.lines', 1)
            ->has('methods', 4));
});

it('keeps waiters and kitchen staff from charging', function () {
    openCash($this);

    $this->actingAs($this->waiter)->get(route('orders.checkout', $this->order))->assertForbidden();
    pay($this, [], $this->waiter)->assertForbidden();
});

it('refuses to charge while the cash is closed', function () {
    pay($this)->assertSessionHasErrors('amount');

    expect(Payment::count())->toBe(0);
});

it('charges in cash with change and closes the account', function () {
    $session = openCash($this);

    pay($this, ['amount' => '50', 'tendered' => '100'])->assertRedirect(route('orders.receipt', $this->order));

    $payment = Payment::firstOrFail();
    $this->order->refresh();

    expect($payment->amount_cents)->toBe(5000)
        ->and($payment->tendered_cents)->toBe(10000)
        ->and($payment->changeCents())->toBe(5000)
        ->and($payment->cash_session_id)->toBe($session->id)
        ->and($this->order->status)->toBe(OrderStatus::Paid)
        ->and($this->order->paid_at)->not->toBeNull()
        ->and(DiningTable::find($this->table->id)->openOrders()->exists())->toBeFalse();
});

it('accepts split and partial payments until the account is covered', function () {
    openCash($this);

    pay($this, ['amount' => '20', 'method' => 'yape', 'reference' => '12345'])->assertRedirect();
    expect($this->order->refresh()->status)->toBe(OrderStatus::Open)->and($this->order->paidCents())->toBe(2000);

    pay($this, ['amount' => '30', 'method' => 'cash'])->assertRedirect(route('orders.receipt', $this->order));
    expect($this->order->refresh()->status)->toBe(OrderStatus::Paid)->and($this->order->paidCents())->toBe(5000);
});

it('rejects an amount above what is left and invalid methods', function () {
    openCash($this);

    pay($this, ['amount' => '80'])->assertSessionHasErrors('amount');
    pay($this, ['method' => 'bitcoin'])->assertSessionHasErrors('method');
    pay($this, ['amount' => '0'])->assertSessionHasErrors('amount');

    expect(Payment::count())->toBe(0);
});

it('does not duplicate a payment sent twice with the same client id', function () {
    openCash($this);
    $clientId = (string) Str::uuid();

    pay($this, ['client_id' => $clientId, 'amount' => '20']);
    pay($this, ['client_id' => $clientId, 'amount' => '20']);

    expect(Payment::count())->toBe(1);
});

it('uses the exact amount for digital methods even if tendered is sent', function () {
    openCash($this);

    pay($this, ['method' => 'card', 'amount' => '25', 'tendered' => '500']);

    expect(Payment::firstOrFail()->tendered_cents)->toBe(2500);
});

it('shows the receipt only for paid accounts', function () {
    openCash($this);

    $this->actingAs($this->cashier)->get(route('orders.receipt', $this->order))->assertForbidden();

    pay($this);

    $this->actingAs($this->cashier)
        ->get(route('orders.receipt', $this->order))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('orders/receipt')
            ->where('order.paid_cents', 5000)
            ->has('order.payments', 1)
            ->has('order.branch.name'));
});

it('voids a payment and reopens the account', function () {
    openCash($this);
    pay($this);
    $payment = Payment::firstOrFail();

    $this->actingAs($this->cashier)->patch(route('payments.void', $payment))->assertRedirect();

    expect($payment->refresh()->isVoided())->toBeTrue()
        ->and($this->order->refresh()->status)->toBe(OrderStatus::Open)
        ->and($this->order->paid_at)->toBeNull()
        ->and($this->order->paidCents())->toBe(0);
});

it('does not reopen a voided account whose tables were taken meanwhile', function () {
    openCash($this);
    pay($this);
    $payment = Payment::firstOrFail();

    $variant = $this->variant;
    $this->actingAs($this->waiter)->post(route('orders.store'), [
        'client_id' => (string) Str::uuid(),
        'type' => 'dine_in',
        'table_ids' => [$this->table->id],
        'items' => [['variant_id' => $variant->id, 'quantity' => 1]],
    ]);

    $this->actingAs($this->cashier)
        ->patch(route('payments.void', $payment))
        ->assertSessionHasErrors('table_ids');

    expect($payment->refresh()->isVoided())->toBeFalse();
});

it('limits who can void a payment and for how long', function () {
    openCash($this);
    pay($this);
    $payment = Payment::firstOrFail();
    $other = User::factory()->for($this->branch)->create()->assignRole(Role::Cashier->value);

    $this->actingAs($other)->patch(route('payments.void', $payment))->assertForbidden();

    $this->travel(11)->minutes();

    $this->actingAs($this->cashier)->patch(route('payments.void', $payment))->assertForbidden();
    $this->actingAs($this->admin)->patch(route('payments.void', $payment))->assertRedirect();
});

it('does not void payments of a closed cash', function () {
    $session = openCash($this);
    pay($this);
    $this->actingAs($this->cashier)->patch(route('cash.sessions.close', $session), ['counted' => '150']);

    $this->actingAs($this->admin)->patch(route('payments.void', Payment::firstOrFail()))->assertForbidden();
});

it('blocks cancelling or changing a paid or partly paid account', function () {
    openCash($this);
    pay($this, ['amount' => '10']);
    $item = $this->order->items()->firstOrFail();

    $this->actingAs($this->waiter)->patch(route('orders.cancel', $this->order))->assertForbidden();
    $this->actingAs($this->admin)->patch(route('items.cancel', $item))->assertForbidden();
});

it('summarizes the cash by method and computes the expected cash', function () {
    $session = openCash($this, '100');
    pay($this, ['amount' => '20', 'method' => 'yape']);
    pay($this, ['amount' => '30', 'method' => 'cash']);

    $this->actingAs($this->cashier)
        ->get(route('cash.index'))
        ->assertInertia(fn ($page) => $page
            ->where('session.id', $session->id)
            ->where('session.totals.yape', 2000)
            ->where('session.totals.cash', 3000)
            ->where('session.expected_cents', 13000)
            ->where('session.payments_count', 2)
            ->has('recent_payments', 2)
            ->has('to_collect', 0));

    $this->actingAs($this->cashier)->patch(route('cash.sessions.close', $session), ['counted' => '130']);

    expect($session->refresh()->difference_cents)->toBe(0)->and($session->expected_cents)->toBe(13000);
});

it('lists open accounts to collect with what is already paid', function () {
    openCash($this);
    pay($this, ['amount' => '10']);

    $this->actingAs($this->cashier)
        ->get(route('cash.index'))
        ->assertInertia(fn ($page) => $page
            ->has('to_collect', 1)
            ->where('to_collect.0.paid_cents', 1000)
            ->where('to_collect.0.total_cents', 5000));
});

it('shows real sales and cash status on the dashboard', function () {
    openCash($this);
    pay($this, ['amount' => '50']);

    $this->actingAs($this->cashier)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page
            ->where('stats.sales_cents', 5000)
            ->where('stats.orders_today', 1)
            ->where('stats.cash_open', true));

    $this->actingAs($this->waiter)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page->where('stats.sales_cents', null)->where('stats.orders_today', 1));
});

it('exposes charge and receipt abilities on the account page', function () {
    openCash($this);

    $this->actingAs($this->cashier)
        ->get(route('orders.show', $this->order))
        ->assertInertia(fn ($page) => $page->where('order.can_charge', true)->where('order.can_receipt', false));

    $this->actingAs($this->waiter)
        ->get(route('orders.show', $this->order))
        ->assertInertia(fn ($page) => $page->where('order.can_charge', false));
});

it('formats the payment method labels', function () {
    expect(PaymentMethod::Yape->label())->toBe('Yape')->and(PaymentMethod::Cash->label())->toBe('Efectivo');
});

it('stays on the page after a full inline payment instead of jumping to the receipt', function () {
    openCash($this);

    $response = pay($this, ['amount' => '50', 'inline' => true])->assertRedirect();

    expect($response->headers->get('Location'))->not->toBe(route('orders.receipt', $this->order))
        ->and($this->order->refresh()->status)->toBe(OrderStatus::Paid);
});

it('loads the checkout data in the cash and floor pages when asked with ?pay', function () {
    openCash($this);

    $this->actingAs($this->cashier)
        ->get(route('cash.index', ['pay' => $this->order->id]))
        ->assertInertia(fn ($page) => $page
            ->where('checkout.id', $this->order->id)
            ->where('checkout.remaining_cents', 5000));

    $this->actingAs($this->cashier)
        ->get(route('cash.index'))
        ->assertInertia(fn ($page) => $page->where('checkout', null));

    $this->actingAs($this->waiter)
        ->get(route('floor.index', ['pay' => $this->order->id]))
        ->assertInertia(fn ($page) => $page->where('checkout', null)->has('methods', 4));
});
