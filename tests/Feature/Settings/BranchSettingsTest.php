<?php

use App\Enums\Role;
use App\Models\Branch;
use App\Models\User;
use Database\Seeders\RoleSeeder;

beforeEach(function () {
    $this->seed(RoleSeeder::class);
    $this->branch = Branch::factory()->create([
        'name' => 'Cajamarca',
        'warn_after_minutes' => 15,
        'alert_after_minutes' => 25,
        'change_window_minutes' => 10,
    ]);
    $this->admin = User::factory()->for($this->branch)->create()->assignRole(Role::Admin->value);
    $this->waiter = User::factory()->for($this->branch)->create()->assignRole(Role::Waiter->value);
});

function branchPayload(array $overrides = []): array
{
    return [
        'name' => 'Pollería Cajamarca',
        'address' => 'Chanchamayo N° 1527',
        'phone' => '076 555 111',
        'warn_after_minutes' => 12,
        'alert_after_minutes' => 20,
        'change_window_minutes' => 8,
        ...$overrides,
    ];
}

it('shows the branch settings to the admin', function () {
    $this->actingAs($this->admin)
        ->get(route('branch.edit'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('settings/branch')
            ->where('branch.name', 'Cajamarca')
            ->where('branch.warn_after_minutes', 15));
});

it('lets the admin update the branch data and times', function () {
    $this->actingAs($this->admin)
        ->patch(route('branch.update'), branchPayload())
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('branch.edit'));

    $branch = $this->branch->refresh();

    expect($branch->name)->toBe('Pollería Cajamarca')
        ->and($branch->phone)->toBe('076 555 111')
        ->and($branch->warn_after_minutes)->toBe(12)
        ->and($branch->alert_after_minutes)->toBe(20)
        ->and($branch->change_window_minutes)->toBe(8);
});

it('requires the alert to be later than the warning', function () {
    $this->actingAs($this->admin)
        ->patch(route('branch.update'), branchPayload(['warn_after_minutes' => 20, 'alert_after_minutes' => 20]))
        ->assertSessionHasErrors('alert_after_minutes');

    expect($this->branch->refresh()->warn_after_minutes)->toBe(15);
});

it('keeps staff without permission out of the branch settings', function () {
    $this->actingAs($this->waiter)->get(route('branch.edit'))->assertForbidden();
    $this->actingAs($this->waiter)->patch(route('branch.update'), branchPayload())->assertForbidden();

    expect($this->branch->refresh()->name)->toBe('Cajamarca');
});

it('only changes the branch of the logged admin', function () {
    $other = Branch::factory()->create(['name' => 'Bambamarca']);

    $this->actingAs($this->admin)->patch(route('branch.update'), branchPayload());

    expect($other->refresh()->name)->toBe('Bambamarca');
});

it('no longer lets staff delete their own account', function () {
    expect(Route::has('profile.destroy'))->toBeFalse();
});
