<?php

namespace App\Models;

use App\Policies\CashSessionPolicy;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $branch_id
 * @property int $opened_by
 * @property int|null $closed_by
 * @property int $opening_cents
 * @property int|null $expected_cents
 * @property int|null $counted_cents
 * @property int|null $difference_cents
 * @property Carbon $opened_at
 * @property Carbon|null $closed_at
 */
#[Fillable([
    'branch_id', 'opened_by', 'closed_by', 'opening_cents', 'expected_cents',
    'counted_cents', 'difference_cents', 'opened_at', 'closed_at',
])]
#[UsePolicy(CashSessionPolicy::class)]
class CashSession extends Model
{
    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'opened_at' => 'datetime',
            'closed_at' => 'datetime',
        ];
    }

    public function isOpen(): bool
    {
        return $this->closed_at === null;
    }

    /** @return BelongsTo<Branch, $this> */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /** @return BelongsTo<User, $this> */
    public function opener(): BelongsTo
    {
        return $this->belongsTo(User::class, 'opened_by');
    }

    /** @return HasMany<Payment, $this> */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class)->orderByDesc('id');
    }
}
