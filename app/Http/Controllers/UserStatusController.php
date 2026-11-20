<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\UserService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class UserStatusController extends Controller
{
    public function __invoke(Request $request, User $user, UserService $users): RedirectResponse
    {
        Gate::authorize('toggleActive', $user);

        $active = $request->boolean('is_active');

        $users->setActive($user, $active);

        return back();
    }
}
