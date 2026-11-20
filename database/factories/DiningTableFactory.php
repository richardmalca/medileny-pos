<?php

namespace Database\Factories;

use App\Models\Branch;
use App\Models\DiningTable;
use App\Models\Zone;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<DiningTable> */
class DiningTableFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'branch_id' => Branch::factory(),
            'zone_id' => fn (array $attributes) => Zone::factory()->create(['branch_id' => $attributes['branch_id']])->id,
            'name' => 'Mesa '.fake()->unique()->numberBetween(1, 9999),
            'capacity' => fake()->randomElement([2, 3, 4, 6, 10]),
            'sort_order' => 0,
            'is_active' => true,
        ];
    }

    public function inZone(Zone $zone): static
    {
        return $this->state(['zone_id' => $zone->id, 'branch_id' => $zone->branch_id]);
    }
}
