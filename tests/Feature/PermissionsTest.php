<?php

use App\Enums\Permission;
use App\Enums\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Spatie\Permission\Models\Role as RoleModel;

beforeEach(fn () => $this->seed(RoleSeeder::class));

it('creates one permission per enum case', function () {
    expect(Spatie\Permission\Models\Permission::pluck('name')->sort()->values()->all())
        ->toBe(collect(Permission::values())->sort()->values()->all());
});

it('gives the admin every permission', function () {
    expect(RoleModel::findByName(Role::Admin->value)->permissions)->toHaveCount(count(Permission::cases()));
});

it('limits each role to its own permissions', function (Role $role, Permission $allowed, Permission $denied) {
    $user = User::factory()->create()->assignRole($role->value);

    expect($user->can($allowed->value))->toBeTrue()
        ->and($user->can($denied->value))->toBeFalse();
})->with([
    'cashier' => [Role::Cashier, Permission::OpenCash, Permission::ManageUsers],
    'waiter' => [Role::Waiter, Permission::CreateSales, Permission::OpenCash],
    'kitchen' => [Role::Kitchen, Permission::ViewKitchen, Permission::CreateSales],
]);

it('shares the permissions of the signed in user', function () {
    $user = User::factory()->create()->assignRole(Role::Waiter->value);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page
            ->where('auth.permissions', [Permission::CreateSales->value])
            ->where('auth.role', Role::Waiter->label()));
});
