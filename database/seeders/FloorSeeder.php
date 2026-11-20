<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\DiningTable;
use App\Models\Zone;
use Illuminate\Database\Seeder;

class FloorSeeder extends Seeder
{
    public function run(): void
    {
        foreach ($this->layout() as $code => $zones) {
            $branch = Branch::where('code', $code)->firstOrFail();
            $number = 0;

            foreach (array_keys($zones) as $zoneOrder => $zoneName) {
                $zone = Zone::firstOrCreate(
                    ['branch_id' => $branch->id, 'name' => $zoneName],
                    ['sort_order' => $zoneOrder, 'is_active' => true],
                );

                foreach ($zones[$zoneName] as $capacity) {
                    $number++;

                    DiningTable::firstOrCreate(
                        ['branch_id' => $branch->id, 'name' => "Mesa {$number}"],
                        ['zone_id' => $zone->id, 'capacity' => $capacity, 'sort_order' => $number, 'is_active' => true],
                    );
                }
            }
        }
    }

    /** @return array<string, array<string, list<int>>> */
    private function layout(): array
    {
        return [
            'CAJ' => [
                'Primer piso' => [2, 2, 3, 4, 4, 4, 6, 10],
                'Segundo piso' => [2, 4, 4, 4, 6, 10],
                'Terraza' => [2, 2, 4, 4],
            ],
            'BAN' => [
                'Salón' => [2, 2, 4, 4, 6, 10],
                'Terraza' => [2, 2, 4, 4],
            ],
            'BAM' => [
                'Salón' => [2, 3, 4, 4, 6, 10],
            ],
        ];
    }
}
