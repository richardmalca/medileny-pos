<?php

use App\Models\Category;
use App\Models\Product;
use Database\Seeders\DatabaseSeeder;

it('seeds a sample menu without duplicating it', function () {
    $this->seed(DatabaseSeeder::class);
    $this->seed(DatabaseSeeder::class);

    expect(Category::count())->toBe(5)
        ->and(Product::count())->toBe(17)
        ->and(Product::where('is_available', false)->count())->toBe(1)
        ->and(Product::doesntHave('variants')->count())->toBe(0);
});
