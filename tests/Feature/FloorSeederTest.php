<?php

use App\Models\Branch;
use App\Models\DiningTable;
use App\Models\Zone;
use Database\Seeders\DatabaseSeeder;

it('seeds zones and tables for every branch without duplicating them', function () {
    $this->seed(DatabaseSeeder::class);
    $this->seed(DatabaseSeeder::class);

    expect(Zone::count())->toBe(6)
        ->and(DiningTable::count())->toBe(18 + 6 + 4 + 6)
        ->and(DiningTable::where('capacity', 10)->count())->toBe(4)
        ->and(Branch::where('code', 'CAJ')->first()->zones()->count())->toBe(3);
});
