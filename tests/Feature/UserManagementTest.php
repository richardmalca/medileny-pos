<?php

use App\Enums\Role;
use App\Models\Branch;
use App\Models\User;
use Database\Seeders\RoleSeeder;

beforeEach(function () {
    $this->seed(RoleSeeder::class);
    $this->branch = Branch::factory()->create();
    $this->admin = User::factory()->for($this->branch)->create()->assignRole(Role::Admin->value);
});

function validUserData(Branch $branch, array $overrides = []): array
{
    return [
        'name' => 'Rosa Huamán',
        'email' => 'Rosa@Medileny.test',
        'password' => 'password',
        'role' => Role::Cashier->value,
        'branch_id' => $branch->id,
        ...$overrides,
    ];
}

it('lists the team for an admin', function () {
    $this->actingAs($this->admin)
        ->get(route('users.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('users/index')
            ->has('users', 1));
});

it('forbids the team screens to users without permission', function (Role $role) {
    $user = User::factory()->create()->assignRole($role->value);

    $this->actingAs($user)->get(route('users.index'))->assertForbidden();
    $this->actingAs($user)->get(route('users.create'))->assertForbidden();
    $this->actingAs($user)->post(route('users.store'), validUserData($this->branch))->assertForbidden();
})->with([Role::Cashier, Role::Waiter, Role::Kitchen]);

it('creates a verified user with a role and branch', function () {
    $this->actingAs($this->admin)
        ->post(route('users.store'), validUserData($this->branch))
        ->assertRedirect(route('users.index'));

    $user = User::where('email', 'rosa@medileny.test')->firstOrFail();

    expect($user->hasRole(Role::Cashier->value))->toBeTrue()
        ->and($user->branch_id)->toBe($this->branch->id)
        ->and($user->is_active)->toBeTrue()
        ->and($user->email_verified_at)->not->toBeNull();
});

it('rejects invalid data when creating a user', function () {
    $this->actingAs($this->admin)
        ->post(route('users.store'), validUserData($this->branch, ['role' => 'dueño', 'email' => $this->admin->email]))
        ->assertSessionHasErrors(['role', 'email']);
});

it('updates a user and keeps the password when left blank', function () {
    $user = User::factory()->for($this->branch)->create()->assignRole(Role::Waiter->value);
    $hash = $user->password;

    $this->actingAs($this->admin)
        ->put(route('users.update', $user), validUserData($this->branch, [
            'email' => $user->email,
            'password' => '',
            'role' => Role::Kitchen->value,
        ]))
        ->assertRedirect(route('users.index'));

    $user->refresh();

    expect($user->hasRole(Role::Kitchen->value))->toBeTrue()
        ->and($user->hasRole(Role::Waiter->value))->toBeFalse()
        ->and($user->password)->toBe($hash);
});

it('deactivates and reactivates a user', function () {
    $user = User::factory()->for($this->branch)->create();

    $this->actingAs($this->admin)->patch(route('users.status', $user), ['is_active' => false]);
    expect($user->refresh()->is_active)->toBeFalse();

    $this->actingAs($this->admin)->patch(route('users.status', $user), ['is_active' => true]);
    expect($user->refresh()->is_active)->toBeTrue();
});

it('does not let an admin deactivate themselves', function () {
    $this->actingAs($this->admin)
        ->patch(route('users.status', $this->admin), ['is_active' => false])
        ->assertForbidden();

    expect($this->admin->refresh()->is_active)->toBeTrue();
});

it('flashes the id of the created user so the creation can be undone', function () {
    $this->actingAs($this->admin)
        ->post(route('users.store'), validUserData($this->branch))
        ->assertInertiaFlash('created_id', User::where('email', 'rosa@medileny.test')->value('id'));
});

it('deletes a user so a just-made creation can be undone', function () {
    $user = User::factory()->for($this->branch)->create()->assignRole(Role::Waiter->value);

    $this->actingAs($this->admin)
        ->delete(route('users.destroy', $user))
        ->assertRedirect(route('users.index'));

    expect(User::find($user->id))->toBeNull();
});

it('does not let an admin delete themselves or a user without permission', function () {
    $this->actingAs($this->admin)->delete(route('users.destroy', $this->admin))->assertForbidden();

    $cashier = User::factory()->create()->assignRole(Role::Cashier->value);
    $target = User::factory()->create();

    $this->actingAs($cashier)->delete(route('users.destroy', $target))->assertForbidden();
});
