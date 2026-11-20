<?php

namespace App\Services;

use App\Enums\PaymentMethod;
use App\Events\FloorChanged;
use App\Models\CashSession;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CashService
{
    public function current(int $branchId): ?CashSession
    {
        return CashSession::query()
            ->where('branch_id', $branchId)
            ->whereNull('closed_at')
            ->first();
    }

    public function open(User $user, int $openingCents): CashSession
    {
        return DB::transaction(function () use ($user, $openingCents) {
            if ($this->current((int) $user->branch_id) !== null) {
                throw ValidationException::withMessages(['opening' => 'Ya hay una caja abierta en esta sucursal.']);
            }

            $session = CashSession::create([
                'branch_id' => $user->branch_id,
                'opened_by' => $user->id,
                'opening_cents' => $openingCents,
                'opened_at' => now(),
            ]);

            FloorChanged::dispatch($session->branch_id, 'cash');

            return $session;
        });
    }

    public function undoOpen(CashSession $session): void
    {
        if ($session->payments()->exists()) {
            throw ValidationException::withMessages(['opening' => 'La caja ya tiene cobros y no se puede deshacer.']);
        }

        $session->delete();

        FloorChanged::dispatch($session->branch_id, 'cash');
    }

    public function close(User $user, CashSession $session, int $countedCents): CashSession
    {
        return DB::transaction(function () use ($user, $session, $countedCents) {
            $expected = $this->summary($session)['expected_cents'];

            $session->update([
                'closed_by' => $user->id,
                'closed_at' => now(),
                'expected_cents' => $expected,
                'counted_cents' => $countedCents,
                'difference_cents' => $countedCents - $expected,
            ]);

            FloorChanged::dispatch($session->branch_id, 'cash');

            return $session;
        });
    }

    public function reopen(CashSession $session): CashSession
    {
        return DB::transaction(function () use ($session) {
            if ($this->current($session->branch_id) !== null) {
                throw ValidationException::withMessages(['counted' => 'Ya hay otra caja abierta en esta sucursal.']);
            }

            $session->update([
                'closed_by' => null,
                'closed_at' => null,
                'expected_cents' => null,
                'counted_cents' => null,
                'difference_cents' => null,
            ]);

            FloorChanged::dispatch($session->branch_id, 'cash');

            return $session;
        });
    }

    /** @return array{totals: array<string, int>, cash_sales_cents: int, expected_cents: int, payments_count: int} */
    public function summary(CashSession $session): array
    {
        $payments = Payment::query()
            ->where('cash_session_id', $session->id)
            ->whereNull('voided_at')
            ->get();

        $totals = [];

        foreach (PaymentMethod::cases() as $method) {
            $totals[$method->value] = (int) $payments->where('method', $method)->sum('amount_cents');
        }

        return [
            'totals' => $totals,
            'cash_sales_cents' => $totals[PaymentMethod::Cash->value],
            'expected_cents' => $session->opening_cents + $totals[PaymentMethod::Cash->value],
            'payments_count' => $payments->count(),
        ];
    }
}
