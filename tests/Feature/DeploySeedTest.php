<?php

use App\Enums\Role;
use App\Models\Branch;
use App\Models\DiningTable;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Support\Facades\Hash;

it('restores the team, floor and menu on every deploy, also in production', function () {
    app()->detectEnvironment(fn () => 'production');

    app(DatabaseSeeder::class)->setContainer(app())->run();

    expect(Branch::count())->toBe(3)
        ->and(User::count())->toBe(15)
        ->and(User::role(Role::Admin->value)->count())->toBe(1)
        ->and(DiningTable::count())->toBe(34)
        ->and(Product::count())->toBe(17);
});

it('does not overwrite what was edited when the seeders run again', function () {
    $this->seed(DatabaseSeeder::class);

    $admin = User::where('email', 'medileny@medileny.test')->firstOrFail();
    $admin->update(['name' => 'Nombre editado', 'password' => 'Otra-clave-2026']);
    $price = ProductVariant::firstOrFail();
    $price->update(['price_cents' => 99900]);
    $table = DiningTable::firstOrFail();
    $table->update(['capacity' => 12]);

    $this->seed(DatabaseSeeder::class);

    expect($admin->refresh()->name)->toBe('Nombre editado')
        ->and(Hash::check('Otra-clave-2026', $admin->password))->toBeTrue()
        ->and($price->refresh()->price_cents)->toBe(99900)
        ->and($table->refresh()->capacity)->toBe(12)
        ->and(User::count())->toBe(15)
        ->and(ProductVariant::count())->toBe(ProductVariant::distinct('id')->count());
});

it('uses the configured seed password for the sample accounts', function () {
    config(['app.seed_password' => 'Clave-de-despliegue-1']);

    $this->seed(DatabaseSeeder::class);

    $user = User::where('email', 'rosa@medileny.test')->firstOrFail();

    expect(Hash::check('Clave-de-despliegue-1', $user->password))->toBeTrue()
        ->and($user->hasRole(Role::Cashier->value))->toBeTrue()
        ->and($user->email_verified_at)->not->toBeNull();
});
