<?php

namespace Database\Seeders;

use App\Models\Branch;
use Illuminate\Database\Seeder;

class BranchSeeder extends Seeder
{
    public function run(): void
    {
        $branches = [
            [
                'code' => 'CAJ',
                'name' => 'Pollería Medileny - Cajamarca',
                'address' => 'Chanchamayo N° 1527, Cajamarca',
            ],
            [
                'code' => 'BAN',
                'name' => 'Pollería Medileny - Baños del Inca',
                'address' => 'Av. Manco Cápac N° 136, Baños del Inca',
            ],
            [
                'code' => 'BAM',
                'name' => 'Pollería Medileny - Bambamarca',
                'address' => 'Francisco Bolognesi N° 830, Bambamarca',
            ],
        ];

        foreach ($branches as $branch) {
            Branch::firstOrCreate(['code' => $branch['code']], $branch + ['is_active' => true]);
        }
    }
}
