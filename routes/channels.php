<?php

use App\Enums\Permission;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('branch.{branchId}.floor', fn (User $user, int $branchId) => $user->branch_id === $branchId
    && $user->can(Permission::CreateSales->value));

Broadcast::channel('branch.{branchId}.kitchen', fn (User $user, int $branchId) => $user->branch_id === $branchId
    && $user->can(Permission::ViewKitchen->value));

Broadcast::channel('branch.{branchId}.cash', fn (User $user, int $branchId) => $user->branch_id === $branchId
    && ($user->can(Permission::OpenCash->value) || $user->can(Permission::ChargeSales->value)));
