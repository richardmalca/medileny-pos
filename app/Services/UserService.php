<?php

namespace App\Services;

use App\Enums\Role;
use App\Models\Branch;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class UserService
{
    /** @return Collection<int, User> */
    public function all(): Collection
    {
        return User::query()
            ->with(['branch', 'roles'])
            ->orderByDesc('is_active')
            ->orderBy('name')
            ->get();
    }

    /** @param array<string, mixed> $data */
    public function create(array $data): User
    {
        return DB::transaction(function () use ($data) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
                'branch_id' => $data['branch_id'],
                'is_active' => true,
            ]);

            $user->forceFill(['email_verified_at' => now()])->save();
            $user->syncRoles($data['role']);

            return $user;
        });
    }

    /** @param array<string, mixed> $data */
    public function update(User $user, array $data): User
    {
        return DB::transaction(function () use ($user, $data) {
            $user->fill([
                'name' => $data['name'],
                'email' => $data['email'],
                'branch_id' => $data['branch_id'],
            ]);

            if (! empty($data['password'])) {
                $user->password = $data['password'];
            }

            $user->save();
            $user->syncRoles($data['role']);

            return $user;
        });
    }

    public function delete(User $user): void
    {
        $user->delete();
    }

    public function setActive(User $user, bool $active): User
    {
        $user->update(['is_active' => $active]);

        return $user;
    }

    /** @return array{roles: list<array{value: string, label: string}>, branches: array<int, array{id: int, name: string}>} */
    public function formOptions(): array
    {
        return [
            'roles' => array_map(
                fn (Role $role) => ['value' => $role->value, 'label' => $role->label()],
                Role::cases(),
            ),
            'branches' => array_map(
                fn (Branch $branch) => ['id' => $branch->id, 'name' => $branch->name],
                Branch::query()->where('is_active', true)->orderBy('name')->get(['id', 'name'])->all(),
            ),
        ];
    }
}
