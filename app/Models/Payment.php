<?php

namespace App\Models;

use App\Enums\PaymentMethod;
use App\Policies\PaymentPolicy;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $order_id
 * @property int $cash_session_id
 * @property int $user_id
 * @property string $client_id
 * @property PaymentMethod $method
 * @property int $amount_cents
 * @property int $tendered_cents
 * @property string|null $reference
 * @property Carbon|null $voided_at
 * @property int|null $voided_by
 * @property Carbon|null $created_at
 */
#[Fillable([
    'order_id', 'cash_session_id', 'user_id', 'client_id', 'method', 'amount_cents',
    'tendered_cents', 'reference', 'voided_at', 'voided_by',
])]
#[UsePolicy(PaymentPolicy::class)]
class Payment extends Model
{
    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'method' => PaymentMethod::class,
            'voided_at' => 'datetime',
        ];
    }

    public function isVoided(): bool
    {
        return $this->voided_at !== null;
    }

    public function changeCents(): int
    {
        return $this->tendered_cents - $this->amount_cents;
    }

    /** @return BelongsTo<Order, $this> */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /** @return BelongsTo<CashSession, $this> */
    public function session(): BelongsTo
    {
        return $this->belongsTo(CashSession::class, 'cash_session_id');
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
