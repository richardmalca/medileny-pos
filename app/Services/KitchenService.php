<?php

namespace App\Services;

use App\Enums\KitchenStage;
use App\Enums\OrderStatus;
use App\Events\KitchenTicketChanged;
use App\Models\OrderRound;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Validation\ValidationException;

class KitchenService
{
    public const CANCELLED_VISIBLE_MINUTES = 15;

    public const HANDED_VISIBLE_MINUTES = 60;

    /** @return Collection<int, OrderRound> */
    public function board(User $user): Collection
    {
        $cancelledSince = now()->subMinutes(self::CANCELLED_VISIBLE_MINUTES);

        return OrderRound::query()
            ->whereHas('order', fn (Builder $query) => $query->where('branch_id', $user->branch_id))
            ->whereHas('items', fn (Builder $query) => $query->where('needs_kitchen', true))
            ->where(fn (Builder $query) => $query
                ->where(fn (Builder $active) => $active
                    ->whereNull('cancelled_at')
                    ->whereHas('order', fn (Builder $order) => $order->where('status', '!=', OrderStatus::Cancelled->value))
                    ->where(fn (Builder $visible) => $visible
                        ->whereNull('handed_at')
                        ->orWhere('handed_at', '>=', now()->subMinutes(self::HANDED_VISIBLE_MINUTES))))
                ->orWhere(fn (Builder $cancelled) => $cancelled
                    ->whereNotNull('received_at')
                    ->where(fn (Builder $when) => $when
                        ->where('cancelled_at', '>=', $cancelledSince)
                        ->orWhereHas('order', fn (Builder $order) => $order
                            ->where('status', OrderStatus::Cancelled->value)
                            ->where('updated_at', '>=', $cancelledSince)))))
            ->with(['order.tables', 'order.branch', 'user', 'items'])
            ->orderBy('sent_at')
            ->get();
    }

    public function move(User $user, OrderRound $round, KitchenStage $to): OrderRound
    {
        $current = KitchenStage::of($round);

        if (abs($to->value - $current->value) !== 1) {
            throw ValidationException::withMessages(['stage' => 'Ese paso no está disponible.']);
        }

        if ($to->value > $current->value) {
            $round->forceFill([$to->column() => now()]);
        } else {
            $round->forceFill([$current->column() => null]);
        }

        $round->forceFill(['kitchen_user_id' => $user->id])->save();

        $order = $round->order()->with('tables')->firstOrFail();

        KitchenTicketChanged::dispatch(
            $order->branch_id,
            $round->id,
            $order->id,
            $round->user_id,
            $order->label(),
            KitchenTicketChanged::STAGE,
            $to->value,
            $to->label(),
        );

        return $round;
    }
}
