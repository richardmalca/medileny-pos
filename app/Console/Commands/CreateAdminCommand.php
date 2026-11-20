<?php

namespace App\Console\Commands;

use App\Enums\Role;
use App\Models\Branch;
use App\Models\User;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Validation\Rules\Password;
use Spatie\Permission\Models\Role as RoleModel;

use function Laravel\Prompts\password;
use function Laravel\Prompts\select;
use function Laravel\Prompts\text;

#[Signature('app:create-admin {--name=} {--email=} {--branch=} {--password=}')]
#[Description('Crea un usuario administrador, útil para el primer acceso en producción')]
class CreateAdminCommand extends Command
{
    public function handle(): int
    {
        if (! RoleModel::where('name', Role::Admin->value)->exists()) {
            $this->components->error('Faltan los roles. Ejecuta primero: php artisan db:seed --force');

            return self::FAILURE;
        }

        $branch = $this->branch();

        if ($branch === null) {
            $this->components->error('No hay sucursales activas o el código indicado no existe.');

            return self::FAILURE;
        }

        $name = $this->option('name') ?: text('Nombre completo', required: true);
        $email = strtolower($this->option('email') ?: text('Correo electrónico', required: true));
        $secret = $this->option('password') ?: password('Contraseña', required: true);

        if (User::where('email', $email)->exists()) {
            $this->components->error("Ya existe un usuario con el correo {$email}.");

            return self::FAILURE;
        }

        $failures = validator(['password' => $secret], ['password' => [Password::default()]])->errors();

        if ($failures->isNotEmpty()) {
            $this->components->error($failures->first());

            return self::FAILURE;
        }

        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => $secret,
            'branch_id' => $branch->id,
            'is_active' => true,
        ]);

        $user->forceFill(['email_verified_at' => now()])->save();
        $user->assignRole(Role::Admin->value);

        $this->components->info("Administrador {$email} creado en {$branch->name}.");

        return self::SUCCESS;
    }

    private function branch(): ?Branch
    {
        $branches = Branch::query()->where('is_active', true)->orderBy('name')->get();

        if ($code = $this->option('branch')) {
            return $branches->firstWhere('code', $code);
        }

        if ($branches->isEmpty()) {
            return null;
        }

        $id = select('Sucursal', $branches->pluck('name', 'id')->all());

        return $branches->firstWhere('id', $id);
    }
}
