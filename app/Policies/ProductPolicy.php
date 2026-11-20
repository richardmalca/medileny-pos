<?php

namespace App\Policies;

use App\Enums\Permission;
use App\Models\Product;
use App\Models\User;

class ProductPolicy
{
    public function viewAny(User $actor): bool
    {
        return $actor->can(Permission::ManageMenu->value);
    }

    public function create(User $actor): bool
    {
        return $actor->can(Permission::ManageMenu->value);
    }

    public function update(User $actor, Product $product): bool
    {
        return $actor->can(Permission::ManageMenu->value);
    }

    public function delete(User $actor, Product $product): bool
    {
        return $actor->can(Permission::ManageMenu->value);
    }
}
