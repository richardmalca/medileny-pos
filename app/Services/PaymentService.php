<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Events\FloorChanged;
use App\Models\Order;
use App\Models\Payment;
use App\Models\User;
use App\Support\Money;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PaymentService
{
    public function __construct(
        private readonly CashService $cash,
        private readonly OrderService $orders,
    ) {}

    /** @param array<string, mixed> $data */
    public function charge(User $cashier, Order $order, array $data): Payment
    {
        $existing = Payment::where('client_id', $data['client_id'])->first();

        if ($existing !== null) {
            return $existing;
        }

        return DB::transaction(function () use ($cashier, $order, $data) {
            $session = $this->cash->current($order->branch_id)
                ?? throw ValidationException::withMessages(['amount' => 'Abre la caja antes de cobrar.']);

            $order->load('payments');
            $remaining = $order->total_cents - $order->paidCents();
            $amount = Money::toCents($data['amount']);
            $method = PaymentMethod::from($data['method']);

            if ($remaining <= 0) {
                throw ValidationException::withMessages(['amount' => 'La cuenta ya está pagada.']);
            }

            if ($amount > $remaining) {
                throw ValidationException::withMessages([
                    'amount' => 'El monto supera lo que falta cobrar ('.Money::format($remaining).').',
                ]);
            }

            $tendered = $method === PaymentMethod::Cash
                ? max($amount, Money::toCents($data['tendered'] ?? $data['amount']))
                : $amount;

            $payment = $order->payments()->create([
                'cash_session_id' => $session->id,
                'user_id' => $cashier->id,
                'client_id' => $data['client_id'],
                'method' => $method,
                'amount_cents' => $amount,
                'tendered_cents' => $tendered,
                'reference' => $data['reference'] ?? null,
            ]);

            $order->load('payments');

            if ($order->paidCents() >= $order->total_cents) {
                $order->update(['status' => OrderStatus::Paid, 'paid_at' => now()]);
            }

            FloorChanged::dispatch($order->branch_id, 'payment', $order->id);

            return $payment;
        });
    }

    public function void(User $actor, Payment $payment): Payment
    {
        return DB::transaction(function () use ($actor, $payment) {
            $payment->update(['voided_at' => now(), 'voided_by' => $actor->id]);
            $this->orders->reopen($payment->order);

            FloorChanged::dispatch($payment->order->branch_id, 'payment_voided', $payment->order_id);

            return $payment;
        });
    }
}
