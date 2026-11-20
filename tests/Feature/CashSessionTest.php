<?php

use App\Enums\Role;
use App\Models\Branch;
use App\Models\CashSession;
use App\Models\User;
use Database\Seeders\RoleSeeder;

beforeEach(function () {
    $this->seed(RoleSeeder::class);
    $this->branch = Branch::factory()->create();
    $this->cashier = User::factory()->for($this->branch)->create()->assignRole(Role::Cashier->value);
    $this->admin = User::factory()->for($this->branch)->create()->assignRole(Role::Admin->value);
});

it('shows the cash screen to cashiers and forbids it to waiters and kitchen', function () {
    $this->actingAs($this->cashier)
        ->get(route('cash.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('cash/index')->where('session', null)->has('methods', 4));

    foreach ([Role::Waiter, Role::Kitchen] as $role) {
        $user = User::factory()->for($this->branch)->create()->assignRole($role->value);
        $this->actingAs($user)->get(route('cash.index'))->assertForbidden();
    }
});

it('opens the cash with the opening amount in cents', function () {
    $this->actingAs($this->cashier)
        ->post(route('cash.sessions.store'), ['opening' => '150.50'])
        ->assertRedirect();

    $session = CashSession::firstOrFail();

    expect($session->opening_cents)->toBe(15050)
        ->and($session->branch_id)->toBe($this->branch->id)
        ->and($session->opened_by)->toBe($this->cashier->id)
        ->and($session->isOpen())->toBeTrue();
});

it('does not open a second cash in the same branch', function () {
    $this->actingAs($this->cashier)->post(route('cash.sessions.store'), ['opening' => '100']);

    $this->actingAs($this->admin)
        ->post(route('cash.sessions.store'), ['opening' => '50'])
        ->assertSessionHasErrors('opening');

    expect(CashSession::count())->toBe(1);
});

it('keeps waiters from opening the cash', function () {
    $waiter = User::factory()->for($this->branch)->create()->assignRole(Role::Waiter->value);

    $this->actingAs($waiter)->post(route('cash.sessions.store'), ['opening' => '100'])->assertForbidden();
});

it('validates the opening amount', function () {
    $this->actingAs($this->cashier)->post(route('cash.sessions.store'), ['opening' => '-5'])->assertSessionHasErrors('opening');
    $this->actingAs($this->cashier)->post(route('cash.sessions.store'), [])->assertSessionHasErrors('opening');
});

it('closes the cash storing expected, counted and the difference', function () {
    $this->actingAs($this->cashier)->post(route('cash.sessions.store'), ['opening' => '100']);
    $session = CashSession::firstOrFail();

    $this->actingAs($this->cashier)
        ->patch(route('cash.sessions.close', $session), ['counted' => '95.00'])
        ->assertRedirect();

    $session->refresh();

    expect($session->isOpen())->toBeFalse()
        ->and($session->expected_cents)->toBe(10000)
        ->and($session->counted_cents)->toBe(9500)
        ->and($session->difference_cents)->toBe(-500)
        ->and($session->closed_by)->toBe($this->cashier->id);
});

it('lets the cash be opened again after closing', function () {
    $this->actingAs($this->cashier)->post(route('cash.sessions.store'), ['opening' => '100']);
    $this->actingAs($this->cashier)->patch(route('cash.sessions.close', CashSession::firstOrFail()), ['counted' => '100']);

    $this->actingAs($this->cashier)->post(route('cash.sessions.store'), ['opening' => '80'])->assertSessionDoesntHaveErrors();

    expect(CashSession::count())->toBe(2);
});

it('undoes the opening only while it has no payments', function () {
    $this->actingAs($this->cashier)->post(route('cash.sessions.store'), ['opening' => '100']);
    $session = CashSession::firstOrFail();

    $this->actingAs($this->cashier)->delete(route('cash.sessions.destroy', $session))->assertRedirect();

    expect(CashSession::count())->toBe(0);
});

it('reopens a closed cash inside the undo window unless another one is open', function () {
    $this->actingAs($this->cashier)->post(route('cash.sessions.store'), ['opening' => '100']);
    $session = CashSession::firstOrFail();
    $this->actingAs($this->cashier)->patch(route('cash.sessions.close', $session), ['counted' => '100']);

    $this->actingAs($this->cashier)->patch(route('cash.sessions.reopen', $session))->assertRedirect();

    expect($session->refresh()->isOpen())->toBeTrue()->and($session->counted_cents)->toBeNull();

    $this->actingAs($this->cashier)->patch(route('cash.sessions.close', $session), ['counted' => '100']);
    $this->actingAs($this->cashier)->post(route('cash.sessions.store'), ['opening' => '10']);

    $this->actingAs($this->cashier)
        ->patch(route('cash.sessions.reopen', $session))
        ->assertSessionHasErrors('counted');
});

it('stops the cashier from reopening after the undo window but not the admin', function () {
    $this->actingAs($this->cashier)->post(route('cash.sessions.store'), ['opening' => '100']);
    $session = CashSession::firstOrFail();
    $this->actingAs($this->cashier)->patch(route('cash.sessions.close', $session), ['counted' => '100']);

    $this->travel(11)->minutes();

    $this->actingAs($this->cashier)->patch(route('cash.sessions.reopen', $session))->assertForbidden();
    $this->actingAs($this->admin)->patch(route('cash.sessions.reopen', $session))->assertRedirect();
});

it('keeps another branch from touching this cash', function () {
    $this->actingAs($this->cashier)->post(route('cash.sessions.store'), ['opening' => '100']);
    $session = CashSession::firstOrFail();
    $stranger = User::factory()->for(Branch::factory())->create()->assignRole(Role::Cashier->value);

    $this->actingAs($stranger)->patch(route('cash.sessions.close', $session), ['counted' => '0'])->assertForbidden();
});
