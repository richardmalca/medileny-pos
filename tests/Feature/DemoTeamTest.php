<?php

use App\Enums\Role;
use App\Models\Branch;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;

it('seeds a realistic team across branches and roles', function () {
    $this->seed(DatabaseSeeder::class);

    expect(Branch::count())->toBe(3)
        ->and(User::count())->toBe(15)
        ->and(User::role(Role::Admin->value)->count())->toBe(1)
        ->and(User::role(Role::Cashier->value)->count())->toBe(4)
        ->and(User::role(Role::Waiter->value)->count())->toBe(6)
        ->and(User::role(Role::Kitchen->value)->count())->toBe(4)
        ->and(User::where('is_active', false)->count())->toBe(1)
        ->and(User::whereNull('branch_id')->count())->toBe(0);
});

it('can be seeded twice without duplicating anything', function () {
    $this->seed(DatabaseSeeder::class);
    $this->seed(DatabaseSeeder::class);

    expect(User::count())->toBe(15)->and(Branch::count())->toBe(3);
});
