<?php

namespace App\Policies;

use App\Enums\Permission;
use App\Models\CashSession;
use App\Models\User;
use Carbon\CarbonInterface;

class CashSessionPolicy
{
    public const UNDO_WINDOW_MINUTES = 10;

    public function viewAny(User $actor): bool
    {
        return $actor->branch_id !== null && (
            $actor->can(Permission::OpenCash->value)
            || $actor->can(Permission::CloseCash->value)
            || $actor->can(Permission::ChargeSales->value)
        );
    }

    public function open(User $actor): bool
    {
        return $actor->branch_id !== null && $actor->can(Permission::OpenCash->value);
    }

    public function close(User $actor, CashSession $session): bool
    {
        return $this->sameBranch($actor, $session)
            && $session->isOpen()
            && $actor->can(Permission::CloseCash->value);
    }

    public function undoOpen(User $actor, CashSession $session): bool
    {
        return $this->sameBranch($actor, $session)
            && $session->isOpen()
            && $actor->can(Permission::OpenCash->value)
            && $this->withinUndoWindow($actor, $session->opened_at);
    }

    public function reopen(User $actor, CashSession $session): bool
    {
        return $this->sameBranch($actor, $session)
            && ! $session->isOpen()
            && $actor->can(Permission::CloseCash->value)
            && $this->withinUndoWindow($actor, $session->closed_at);
    }

    private function sameBranch(User $actor, CashSession $session): bool
    {
        return $actor->branch_id !== null && $actor->branch_id === $session->branch_id;
    }

    private function withinUndoWindow(User $actor, ?CarbonInterface $since): bool
    {
        if ($actor->can(Permission::VoidSales->value)) {
            return true;
        }

        return $since !== null && $since->greaterThan(now()->subMinutes(self::UNDO_WINDOW_MINUTES));
    }
}
