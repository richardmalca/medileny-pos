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
    $this->branch = Branch::factory()->create();
    $this->admin = User::factory()->for($this->branch)->create()->assignRole(Role::Admin->value);
    $this->zone = Zone::factory()->create(['branch_id' => $this->branch->id]);
});

function occupy(DiningTable $table, User $user): Order
{
    test()->actingAs($user)->post(route('orders.store'), [
        'client_id' => (string) Str::uuid(),
        'type' => 'dine_in',
        'table_ids' => [$table->id],
        'items' => [['variant_id' => ProductVariant::factory()->create()->id, 'quantity' => 1]],
    ]);

    return Order::latest('id')->firstOrFail();
}

it('lists zones and tables of a chosen branch for the admin', function () {
    DiningTable::factory()->inZone($this->zone)->create();
    $other = Branch::factory()->create();
    Zone::factory()->create(['branch_id' => $other->id]);

    $this->actingAs($this->admin)
        ->get(route('tables.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('tables/index')->has('zones', 1)->where('branch_id', $this->branch->id));

    $this->actingAs($this->admin)
        ->get(route('tables.index', ['branch' => $other->id]))
        ->assertInertia(fn ($page) => $page->where('branch_id', $other->id)->has('zones', 1));
});

it('forbids table management to staff without permission', function (Role $role) {
    $user = User::factory()->for($this->branch)->create()->assignRole($role->value);

    $this->actingAs($user)->get(route('tables.index'))->assertForbidden();
    $this->actingAs($user)->post(route('zones.store'), ['branch_id' => $this->branch->id, 'name' => 'Terraza'])->assertForbidden();
})->with([Role::Cashier, Role::Waiter, Role::Kitchen]);

it('creates a zone and a table with capacity', function () {
    $this->actingAs($this->admin)
        ->post(route('zones.store'), ['branch_id' => $this->branch->id, 'name' => 'Segundo piso'])
        ->assertRedirect();

    $zone = Zone::where('name', 'Segundo piso')->firstOrFail();

    $this->actingAs($this->admin)
        ->post(route('tables.store'), [
            'branch_id' => $this->branch->id,
            'zone_id' => $zone->id,
            'name' => 'Mesa familiar',
            'capacity' => 10,
        ])
        ->assertRedirect(route('tables.index', ['branch' => $this->branch->id]));

    expect(DiningTable::where('name', 'Mesa familiar')->value('capacity'))->toBe(10);
});

it('rejects duplicated names in the same branch but allows them in another', function () {
    DiningTable::factory()->inZone($this->zone)->create(['name' => 'Mesa 1']);

    $this->actingAs($this->admin)
        ->post(route('tables.store'), ['branch_id' => $this->branch->id, 'zone_id' => $this->zone->id, 'name' => 'Mesa 1', 'capacity' => 4])
        ->assertSessionHasErrors('name');

    $other = Zone::factory()->create();

    $this->actingAs($this->admin)
        ->post(route('tables.store'), ['branch_id' => $other->branch_id, 'zone_id' => $other->id, 'name' => 'Mesa 1', 'capacity' => 4])
        ->assertSessionDoesntHaveErrors();
});

it('rejects a zone from another branch and out of range capacities', function () {
    $foreign = Zone::factory()->create();

    $this->actingAs($this->admin)
        ->post(route('tables.store'), ['branch_id' => $this->branch->id, 'zone_id' => $foreign->id, 'name' => 'Mesa 2', 'capacity' => 0])
        ->assertSessionHasErrors(['zone_id', 'capacity']);
});

it('updates the name, zone and capacity of a table', function () {
    $table = DiningTable::factory()->inZone($this->zone)->create(['name' => 'Mesa 1', 'capacity' => 2]);
    $second = Zone::factory()->create(['branch_id' => $this->branch->id]);

    $this->actingAs($this->admin)
        ->put(route('tables.update', $table), ['zone_id' => $second->id, 'name' => 'Mesa 1A', 'capacity' => 6])
        ->assertRedirect();

    $table->refresh();

    expect($table->name)->toBe('Mesa 1A')->and($table->zone_id)->toBe($second->id)->and($table->capacity)->toBe(6);
});

it('archives and reactivates a table, but not while it is occupied', function () {
    $table = DiningTable::factory()->inZone($this->zone)->create();

    $this->actingAs($this->admin)->patch(route('tables.status', $table), ['is_active' => false]);
    expect($table->refresh()->is_active)->toBeFalse();

    $this->actingAs($this->admin)->patch(route('tables.status', $table), ['is_active' => true]);
    expect($table->refresh()->is_active)->toBeTrue();

    occupy($table, $this->admin);

    $this->actingAs($this->admin)
        ->patch(route('tables.status', $table), ['is_active' => false])
        ->assertSessionHasErrors('is_active');

    expect($table->refresh()->is_active)->toBeTrue();
});

it('archives a zone but not while one of its tables is occupied', function () {
    $table = DiningTable::factory()->inZone($this->zone)->create();

    occupy($table, $this->admin);

    $this->actingAs($this->admin)
        ->patch(route('zones.status', $this->zone), ['is_active' => false])
        ->assertSessionHasErrors('is_active');

    $empty = Zone::factory()->create(['branch_id' => $this->branch->id]);
    $this->actingAs($this->admin)->patch(route('zones.status', $empty), ['is_active' => false]);

    expect($empty->refresh()->is_active)->toBeFalse();
});

it('deletes a table or zone that was never used, so a creation can be undone', function () {
    $table = DiningTable::factory()->inZone($this->zone)->create();

    $this->actingAs($this->admin)->delete(route('tables.destroy', $table))->assertRedirect();
    expect(DiningTable::find($table->id))->toBeNull();

    $this->actingAs($this->admin)->delete(route('zones.destroy', $this->zone))->assertRedirect();
    expect(Zone::find($this->zone->id))->toBeNull();
});

it('refuses to delete tables that have history or zones that still have tables', function () {
    $table = DiningTable::factory()->inZone($this->zone)->create();

    $this->actingAs($this->admin)->delete(route('zones.destroy', $this->zone))->assertForbidden();

    occupy($table, $this->admin);
    Order::query()->update(['status' => 'cancelled']);

    $this->actingAs($this->admin)->delete(route('tables.destroy', $table))->assertForbidden();
});
