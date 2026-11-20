<?php

use App\Enums\Role;
use App\Models\Branch;
use App\Models\User;
use Database\Seeders\RoleSeeder;

beforeEach(fn () => $this->seed(RoleSeeder::class));

it('creates one role per enum case', function () {
    expect(Spatie\Permission\Models\Role::pluck('name')->sort()->values()->all())
        ->toBe(collect(Role::values())->sort()->values()->all());
});

it('assigns a role and a branch to a user', function () {
    $branch = Branch::factory()->create();
    $user = User::factory()->for($branch)->create()->assignRole(Role::Cashier->value);

    expect($user->hasRole(Role::Cashier->value))->toBeTrue()
        ->and($user->branch->is($branch))->toBeTrue();
});

it('logs out an inactive user on their next request', function () {
    $user = User::factory()->create(['is_active' => false]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertRedirect(route('login'));

    $this->assertGuest();
});

it('lets an active user reach the dashboard', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->get(route('dashboard'))->assertOk();
});
