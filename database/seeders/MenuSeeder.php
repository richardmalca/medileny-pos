<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;

class MenuSeeder extends Seeder
{
    public function run(): void
    {
        foreach ($this->menu() as $order => $section) {
            $category = Category::firstOrCreate(
                ['name' => $section['name']],
                [
                    'icon' => $section['icon'],
                    'needs_kitchen' => $section['needs_kitchen'] ?? true,
                    'sort_order' => $order,
                ],
            );

            foreach ($section['products'] as $position => $item) {
                $product = Product::firstOrCreate(
                    ['category_id' => $category->id, 'name' => $item['name']],
                    [
                        'description' => $item['description'],
                        'is_available' => $item['is_available'] ?? true,
                        'sort_order' => $position,
                    ],
                );

                if (! $product->wasRecentlyCreated) {
                    continue;
                }

                foreach ($item['variants'] as $index => [$variant, $price]) {
                    $product->variants()->create([
                        'name' => $variant,
                        'price_cents' => $price * 100,
                        'sort_order' => $index,
                    ]);
                }
            }
        }
    }

    /** @return list<array{name: string, icon: string, needs_kitchen?: bool, products: list<array<string, mixed>>}> */
    private function menu(): array
    {
        return [
            [
                'name' => 'Pollo a la brasa',
                'icon' => '🍗',
                'products' => [
                    [
                        'name' => 'Pollo a la brasa',
                        'description' => 'Con papas fritas, ensalada fresca y cremas.',
                        'variants' => [['Pollo entero', 62], ['1/2 pollo', 33], ['1/4 de pollo', 18], ['1/8 de pollo', 11]],
                    ],
                ],
            ],
            [
                'name' => 'Parrillas',
                'icon' => '🥩',
                'products' => [
                    [
                        'name' => 'Anticuchos',
                        'description' => 'Brochetas de corazón con papa y choclo.',
                        'variants' => [['Porción', 22]],
                    ],
                    [
                        'name' => 'Mollejitas',
                        'description' => 'Mollejitas a la parrilla con papas doradas.',
                        'is_available' => false,
                        'variants' => [['Porción', 20]],
                    ],
                    [
                        'name' => 'Chorizo parrillero',
                        'description' => 'Con pan, papas y cremas.',
                        'variants' => [['Unidad', 15]],
                    ],
                    [
                        'name' => 'Parrilla',
                        'description' => 'Pollo, anticuchos, chorizo, papas y ensalada.',
                        'variants' => [['Personal', 35], ['Familiar', 85]],
                    ],
                ],
            ],
            [
                'name' => 'Extras',
                'icon' => '🍟',
                'products' => [
                    [
                        'name' => 'Papas fritas',
                        'description' => 'Doradas y crocantes.',
                        'variants' => [['Personal', 8], ['Familiar', 14]],
                    ],
                    [
                        'name' => 'Ensalada fresca',
                        'description' => 'Lechuga, tomate y pepino.',
                        'variants' => [['Personal', 6], ['Familiar', 12]],
                    ],
                    [
                        'name' => 'Arroz blanco',
                        'description' => 'Porción de arroz graneado.',
                        'variants' => [['Porción', 5]],
                    ],
                    [
                        'name' => 'Yuca frita',
                        'description' => 'Con crema de ají.',
                        'variants' => [['Porción', 9]],
                    ],
                ],
            ],
            [
                'name' => 'Bebidas',
                'icon' => '🥤',
                'needs_kitchen' => false,
                'products' => [
                    [
                        'name' => 'Chicha morada',
                        'description' => 'Hecha en casa.',
                        'variants' => [['Vaso', 4], ['Jarra 1 L', 12]],
                    ],
                    [
                        'name' => 'Limonada',
                        'description' => 'Bien fría.',
                        'variants' => [['Vaso', 4], ['Jarra 1 L', 12]],
                    ],
                    [
                        'name' => 'Gaseosa',
                        'description' => 'Inca Kola o Coca-Cola.',
                        'variants' => [['Personal 500 ml', 4], ['1.5 L', 9], ['3 L', 14]],
                    ],
                    [
                        'name' => 'Cerveza',
                        'description' => 'Botella helada.',
                        'variants' => [['Botella 650 ml', 12]],
                    ],
                    [
                        'name' => 'Agua mineral',
                        'description' => 'Sin gas.',
                        'variants' => [['Botella 625 ml', 3]],
                    ],
                ],
            ],
            [
                'name' => 'Combos',
                'icon' => '🎁',
                'products' => [
                    [
                        'name' => 'Combo personal',
                        'description' => '1/4 de pollo, papas, ensalada y gaseosa personal.',
                        'variants' => [['Combo', 22]],
                    ],
                    [
                        'name' => 'Combo pareja',
                        'description' => '1/2 pollo, papas, ensalada y 2 gaseosas personales.',
                        'variants' => [['Combo', 42]],
                    ],
                    [
                        'name' => 'Combo familiar',
                        'description' => 'Pollo entero, papas familiares, ensalada y gaseosa de 1.5 L.',
                        'variants' => [['Combo', 78]],
                    ],
                ],
            ],
        ];
    }
}
