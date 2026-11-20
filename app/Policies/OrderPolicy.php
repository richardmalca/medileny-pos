<?php

namespace App\Policies;

use App\Enums\OrderStatus;
use App\Enums\Permission;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderRound;
use App\Models\User;
use Carbon\CarbonInterface;

class OrderPolicy
{
    public const UNDO_WINDOW_MINUTES = 10;

    public function create(User $actor): bool
    {
        return $actor->can(Permission::CreateSales->value) && $actor->branch_id !== null;
    }

    public function view(User $actor, Order $order): bool
    {
        return $this->create($actor) && $order->branch_id === $actor->branch_id;
    }

    public function addRound(User $actor, Order $order): bool
    {
        return $this->view($actor, $order) && $order->isOpen();
    }

    public function moveTables(User $actor, Order $order): bool
    {
        return $this->addRound($actor, $order);
    }

    public function charge(User $actor, Order $order): bool
    {
        return $this->addRound($actor, $order)
            && $actor->can(Permission::ChargeSales->value)
            && $order->total_cents > 0;
    }

    public function viewReceipt(User $actor, Order $order): bool
    {
        return $this->view($actor, $order)
            && $order->status === OrderStatus::Paid
            && $actor->can(Permission::ChargeSales->value);
    }

    public function cancel(User $actor, Order $order): bool
    {
        return $this->addRound($actor, $order)
            && $order->paidCents() === 0
            && $order->activeRounds->every(fn (OrderRound $round) => $this->cancelRound($actor, $round));
    }

    public function restore(User $actor, Order $order): bool
    {
        return $this->view($actor, $order)
            && $order->status === OrderStatus::Cancelled
            && $order->items()->whereNull('cancelled_at')->whereHas('round', fn ($query) => $query->whereNull('cancelled_at'))->exists()
            && $this->withinUndoWindow($actor, $order->updated_at);
    }

    public function cancelRound(User $actor, OrderRound $round): bool
    {
        return $this->addRound($actor, $round->order)
            && $round->order->paidCents() === 0
            && ! $round->isCancelled()
            && $round->items->every(fn (OrderItem $item) => $item->cancelled_at !== null || $this->cancelItem($actor, $item));
    }

    public function restoreRound(User $actor, OrderRound $round): bool
    {
        return $this->view($actor, $round->order)
            && $round->order->status !== OrderStatus::Paid
            && $round->isCancelled()
            && $this->withinUndoWindow($actor, $round->cancelled_at);
    }

    public function cancelItem(User $actor, OrderItem $item): bool
    {
        if (! $this->addRound($actor, $item->round->order)
            || $item->round->order->paidCents() > 0
            || ! $item->isActive()) {
            return false;
        }

        if ($actor->can(Permission::VoidSales->value)) {
            return true;
        }

        return $item->served_at === null && $this->isWithinChangeRules($item);
    }

    public function restoreItem(User $actor, OrderItem $item): bool
    {
        return $this->view($actor, $item->round->order)
            && $item->round->order->status !== OrderStatus::Paid
            && $item->cancelled_at !== null
            && ! $item->round->isCancelled()
            && $this->withinUndoWindow($actor, $item->cancelled_at);
    }

    public function viewKitchen(User $actor): bool
    {
        return $actor->branch_id !== null && $actor->can(Permission::ViewKitchen->value);
    }

    public function updateKitchen(User $actor, OrderRound $round): bool
    {
        return $this->viewKitchen($actor)
            && $round->order->branch_id === $actor->branch_id
            && ! $round->isCancelled()
            && $round->order->status !== OrderStatus::Cancelled;
    }

    public function serveItem(User $actor, OrderItem $item): bool
    {
        return $this->addRound($actor, $item->round->order) && $item->isActive();
    }

    public function changeableUntil(OrderItem $item): ?CarbonInterface
    {
        if (! $item->needs_kitchen) {
            return null;
        }

        $round = $item->round;

        if ($round->ready_at !== null) {
            return $round->ready_at;
        }

        return ($round->preparing_at ?? $round->sent_at)->addMinutes($round->order->branch->change_window_minutes);
    }

    private function isWithinChangeRules(OrderItem $item): bool
    {
        $until = $this->changeableUntil($item);

        return $until === null || $until->isFuture();
    }

    private function withinUndoWindow(User $actor, ?CarbonInterface $since): bool
    {
        if ($actor->can(Permission::VoidSales->value)) {
            return true;
        }

        return $since !== null && $since->greaterThan(now()->subMinutes(self::UNDO_WINDOW_MINUTES));
    }
}
