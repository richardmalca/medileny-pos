<?php

namespace App\Models;

use Database\Factories\BranchFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $name
 * @property string $code
 * @property string|null $address
 * @property string|null $phone
 * @property bool $is_active
 * @property int $warn_after_minutes
 * @property int $alert_after_minutes
 * @property int $change_window_minutes
 */
#[Fillable(['name', 'code', 'address', 'phone', 'is_active', 'warn_after_minutes', 'alert_after_minutes', 'change_window_minutes'])]
class Branch extends Model
{
    /** @use HasFactory<BranchFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    /** @return HasMany<Zone, $this> */
    public function zones(): HasMany
    {
        return $this->hasMany(Zone::class);
    }

    /** @return HasMany<User, $this> */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
