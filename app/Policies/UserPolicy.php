<?php

namespace App\Policies;

use App\Enums\Permission;
use App\Models\User;

class UserPolicy
{
    public function viewAny(User $actor): bool
    {
        return $actor->can(Permission::ManageUsers->value);
    }

    public function create(User $actor): bool
    {
        return $actor->can(Permission::ManageUsers->value);
    }

    public function update(User $actor, User $user): bool
    {
        return $actor->can(Permission::ManageUsers->value);
    }

    public function delete(User $actor, User $user): bool
    {
        return $actor->can(Permission::ManageUsers->value) && $actor->isNot($user);
    }

    public function toggleActive(User $actor, User $user): bool
    {
        return $actor->can(Permission::ManageUsers->value) && $actor->isNot($user);
    }
}
