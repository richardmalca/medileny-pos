<?php

namespace App\Models;

use Database\Factories\ZoneFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $branch_id
 * @property string $name
 * @property int $sort_order
 * @property bool $is_active
 */
#[Fillable(['branch_id', 'name', 'sort_order', 'is_active'])]
class Zone extends Model
{
    /** @use HasFactory<ZoneFactory> */
    use HasFactory;

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    /** @return BelongsTo<Branch, $this> */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /** @return HasMany<DiningTable, $this> */
    public function tables(): HasMany
    {
        return $this->hasMany(DiningTable::class)->orderBy('sort_order')->orderBy('id');
    }
}
