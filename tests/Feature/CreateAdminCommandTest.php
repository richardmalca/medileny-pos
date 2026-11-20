<?php

use App\Enums\Role;
use App\Models\Branch;
use App\Models\User;
use Database\Seeders\BranchSeeder;
use Database\Seeders\RoleSeeder;

it('creates a verified active admin in the chosen branch', function () {
    $this->seed(RoleSeeder::class);
    $branch = Branch::factory()->create(['code' => 'CAJ']);

    $this->artisan('app:create-admin', [
        '--name' => 'Medileny Quispe',
        '--email' => 'Dueña@Medileny.com',
        '--branch' => 'CAJ',
        '--password' => 'Clave-segura-2026',
    ])->assertSuccessful();

    $user = User::where('email', 'dueña@medileny.com')->firstOrFail();

    expect($user->hasRole(Role::Admin->value))->toBeTrue()
        ->and($user->branch_id)->toBe($branch->id)
        ->and($user->is_active)->toBeTrue()
        ->and($user->email_verified_at)->not->toBeNull();
});

it('refuses to run before the roles exist', function () {
    Branch::factory()->create(['code' => 'CAJ']);

    $this->artisan('app:create-admin', ['--name' => 'A', '--email' => 'a@b.com', '--branch' => 'CAJ', '--password' => 'Clave-segura-2026'])
        ->assertFailed();

    expect(User::count())->toBe(0);
});

it('rejects an unknown branch and a duplicated email', function () {
    $this->seed(RoleSeeder::class);
    Branch::factory()->create(['code' => 'CAJ']);
    User::factory()->create(['email' => 'a@b.com']);

    $this->artisan('app:create-admin', ['--name' => 'A', '--email' => 'x@b.com', '--branch' => 'ZZZ', '--password' => 'Clave-segura-2026'])->assertFailed();
    $this->artisan('app:create-admin', ['--name' => 'A', '--email' => 'a@b.com', '--branch' => 'CAJ', '--password' => 'Clave-segura-2026'])->assertFailed();
});

it('keeps branch edits when the seeder runs again on a later deploy', function () {
    $this->seed(BranchSeeder::class);
    Branch::where('code', 'CAJ')->update(['name' => 'Nombre editado', 'phone' => '999111222']);

    $this->seed(BranchSeeder::class);

    expect(Branch::where('code', 'CAJ')->first()->name)->toBe('Nombre editado');
});
