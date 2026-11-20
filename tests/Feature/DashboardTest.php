<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\Branch;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $response = $this->get(route('dashboard'));
        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_visit_the_dashboard()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->get(route('dashboard'));
        $response->assertOk();
    }

    public function test_money_figures_are_only_for_staff_who_can_charge()
    {
        $this->seed(RoleSeeder::class);
        $branch = Branch::factory()->create();
        $waiter = User::factory()->for($branch)->create()->assignRole(Role::Waiter->value);
        $cashier = User::factory()->for($branch)->create()->assignRole(Role::Cashier->value);

        $this->actingAs($waiter)->get(route('dashboard'))->assertInertia(fn ($page) => $page
            ->where('stats.sales_cents', null)
            ->where('stats.by_method', null)
            ->where('stats.cash_expected_cents', null)
            ->has('stats.kitchen_queue')
            ->where('stats.my_orders_today', 0));

        $this->actingAs($cashier)->get(route('dashboard'))->assertInertia(fn ($page) => $page
            ->where('stats.sales_cents', 0)
            ->has('stats.by_method', 4));
    }
}
