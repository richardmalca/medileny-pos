<?php

namespace App\Http\Responses;

use App\Enums\Permission;
use App\Models\User;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use Laravel\Fortify\Fortify;

/**
 * Cada rol entra directo a lo suyo: el mozo a las mesas, cocina a la cocina y
 * caja a la caja. La administración sigue entrando por Inicio. Si el usuario
 * intentaba abrir otra página antes de iniciar sesión, se respeta.
 */
class LoginResponse implements LoginResponseContract
{
    public function toResponse($request)
    {
        if ($request->wantsJson()) {
            return response()->json(['two_factor' => false]);
        }

        return redirect()->intended($this->homeFor($request->user()));
    }

    private function homeFor(?User $user): string
    {
        $default = Fortify::redirects('login');

        if ($user === null || $user->can(Permission::ManageUsers->value)) {
            return $default;
        }

        return match (true) {
            $user->can(Permission::OpenCash->value) => route('cash.index', absolute: false),
            $user->can(Permission::CreateSales->value) => route('floor.index', absolute: false),
            $user->can(Permission::ViewKitchen->value) => route('kitchen.index', absolute: false),
            default => $default,
        };
    }
}
