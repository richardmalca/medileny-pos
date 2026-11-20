<?php

namespace App\Policies;

use App\Enums\Permission;
use App\Models\Payment;
use App\Models\User;

class PaymentPolicy
{
    public const UNDO_WINDOW_MINUTES = 10;

    public function void(User $actor, Payment $payment): bool
    {
        if ($payment->isVoided()
            || ! $payment->session->isOpen()
            || $payment->order->branch_id !== $actor->branch_id
            || ! $actor->can(Permission::ChargeSales->value)) {
            return false;
        }

        if ($actor->can(Permission::VoidSales->value)) {
            return true;
        }

        return $payment->user_id === $actor->id
            && $payment->created_at !== null
            && $payment->created_at->greaterThan(now()->subMinutes(self::UNDO_WINDOW_MINUTES));
    }
}
