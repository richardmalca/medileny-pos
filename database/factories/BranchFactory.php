<?php

namespace Database\Factories;

use App\Models\Branch;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Branch> */
class BranchFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => 'Sucursal '.fake()->unique()->city(),
            'code' => strtoupper(fake()->unique()->lexify('???')),
            'address' => fake()->streetAddress(),
            'phone' => fake()->numerify('9########'),
            'is_active' => true,
            'warn_after_minutes' => 15,
            'alert_after_minutes' => 25,
            'change_window_minutes' => 10,
        ];
    }

    public function inactive(): static
    {
        return $this->state(['is_active' => false]);
    }
}
