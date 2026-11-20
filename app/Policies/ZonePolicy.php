<?php

namespace App\Policies;

use App\Enums\Permission;
use App\Models\User;
use App\Models\Zone;

class ZonePolicy
{
    public function create(User $actor): bool
    {
        return $actor->can(Permission::ManageTables->value);
    }

    public function update(User $actor, Zone $zone): bool
    {
        return $actor->can(Permission::ManageTables->value);
    }

    public function delete(User $actor, Zone $zone): bool
    {
        return $actor->can(Permission::ManageTables->value) && ! $zone->tables()->exists();
    }
}
