<?php

namespace App\Policies;

use App\Enums\Permission;
use App\Models\DiningTable;
use App\Models\User;

class DiningTablePolicy
{
    public function viewAny(User $actor): bool
    {
        return $actor->can(Permission::ManageTables->value);
    }

    public function create(User $actor): bool
    {
        return $actor->can(Permission::ManageTables->value);
    }

    public function update(User $actor, DiningTable $table): bool
    {
        return $actor->can(Permission::ManageTables->value);
    }

    public function delete(User $actor, DiningTable $table): bool
    {
        return $actor->can(Permission::ManageTables->value) && ! $table->orders()->exists();
    }
}
