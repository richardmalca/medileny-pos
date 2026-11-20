<?php

use App\Enums\Role;
use App\Models\Branch;
use App\Models\User;
use Database\Seeders\RoleSeeder;

it('sends the root url to the dashboard', function () {
    $this->get('/')->assertRedirect('/dashboard');
});

it('asks guests to log in before reaching the dashboard', function () {
    $this->get('/dashboard')->assertRedirect(route('login'));
});

it('does not offer public registration', function () {
    $this->get('/register')->assertNotFound();
    $this->post('/register', [
        'name' => 'Intruso',
        'email' => 'intruso@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ])->assertNotFound();

    expect(User::where('email', 'intruso@example.com')->exists())->toBeFalse();
});

it('sends each role to its own home after logging in', function () {
    $this->seed(RoleSeeder::class);
    $branch = Branch::factory()->create();

    $homes = [
        Role::Admin->value => '/dashboard',
        Role::Cashier->value => '/cash',
        Role::Waiter->value => '/floor',
        Role::Kitchen->value => '/kitchen',
    ];

    foreach ($homes as $role => $home) {
        $user = User::factory()->for($branch)->create()->assignRole($role);

        $this->post('/login', ['email' => $user->email, 'password' => 'password'])
            ->assertRedirect($home);

        auth()->logout();
    }
});
