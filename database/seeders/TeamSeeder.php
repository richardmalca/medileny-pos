<?php

namespace Database\Seeders;

use App\Enums\Role;
use App\Models\Branch;
use App\Models\User;
use Illuminate\Database\Seeder;

class TeamSeeder extends Seeder
{
    public function run(): void
    {
        $branches = Branch::pluck('id', 'code');

        foreach ($this->team() as $member) {
            $user = User::firstOrCreate(
                ['email' => $member['email']],
                [
                    'name' => $member['name'],
                    'password' => config('app.seed_password'),
                    'branch_id' => $branches[$member['branch']],
                    'is_active' => $member['is_active'] ?? true,
                ],
            );

            if ($user->wasRecentlyCreated) {
                $user->forceFill(['email_verified_at' => now()])->save();
                $user->assignRole($member['role']->value);
            }
        }
    }

    /** @return list<array{name: string, email: string, role: Role, branch: string, is_active?: bool}> */
    private function team(): array
    {
        return [
            ['name' => 'Medileny Quispe Ramos', 'email' => 'medileny@medileny.test', 'role' => Role::Admin, 'branch' => 'CAJ'],
            ['name' => 'Rosa Huamán Pariona', 'email' => 'rosa@medileny.test', 'role' => Role::Cashier, 'branch' => 'CAJ'],
            ['name' => 'Luis Paredes Soto', 'email' => 'luis@medileny.test', 'role' => Role::Cashier, 'branch' => 'CAJ'],
            ['name' => 'Carlos Mendoza Ríos', 'email' => 'carlos@medileny.test', 'role' => Role::Waiter, 'branch' => 'CAJ'],
            ['name' => 'Lucía Flores Cáceres', 'email' => 'lucia@medileny.test', 'role' => Role::Waiter, 'branch' => 'CAJ'],
            ['name' => 'Jhon Chávez Llamocca', 'email' => 'jhon@medileny.test', 'role' => Role::Waiter, 'branch' => 'CAJ'],
            ['name' => 'Pedro Salazar Quiroz', 'email' => 'pedro@medileny.test', 'role' => Role::Kitchen, 'branch' => 'CAJ'],
            ['name' => 'Marisol Vega Tello', 'email' => 'marisol@medileny.test', 'role' => Role::Kitchen, 'branch' => 'CAJ'],
            ['name' => 'Ana Quispe Ramos', 'email' => 'ana@medileny.test', 'role' => Role::Cashier, 'branch' => 'BAN'],
            ['name' => 'Diego Castillo Vargas', 'email' => 'diego@medileny.test', 'role' => Role::Waiter, 'branch' => 'BAN'],
            ['name' => 'Elena Rojas Mamani', 'email' => 'elena@medileny.test', 'role' => Role::Kitchen, 'branch' => 'BAN'],
            ['name' => 'Hilda Tello Cueva', 'email' => 'hilda@medileny.test', 'role' => Role::Cashier, 'branch' => 'BAM'],
            ['name' => 'Segundo Cueva Bustamante', 'email' => 'segundo@medileny.test', 'role' => Role::Waiter, 'branch' => 'BAM'],
            ['name' => 'Nelly Bustamante Díaz', 'email' => 'nelly@medileny.test', 'role' => Role::Kitchen, 'branch' => 'BAM'],
            ['name' => 'Kevin Torres Alva', 'email' => 'kevin@medileny.test', 'role' => Role::Waiter, 'branch' => 'CAJ', 'is_active' => false],
        ];
    }
}
