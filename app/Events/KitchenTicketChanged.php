<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

class KitchenTicketChanged implements ShouldBroadcast, ShouldDispatchAfterCommit
{
    use Dispatchable, InteractsWithSockets;

    public const NEW = 'new';

    public const CANCELLED = 'cancelled';

    public const ITEM_CANCELLED = 'item_cancelled';

    public const STAGE = 'stage';

    public const UPDATED = 'updated';

    public function __construct(
        public readonly int $branchId,
        public readonly int $roundId,
        public readonly int $orderId,
        public readonly int $waiterId,
        public readonly string $label,
        public readonly string $kind,
        public readonly int $stage = 0,
        public readonly string $stageLabel = '',
    ) {}

    /** @return list<PrivateChannel> */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("branch.{$this->branchId}.kitchen"),
            new PrivateChannel("branch.{$this->branchId}.floor"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'kitchen.ticket';
    }

    /** @return array<string, mixed> */
    public function broadcastWith(): array
    {
        return [
            'round_id' => $this->roundId,
            'order_id' => $this->orderId,
            'waiter_id' => $this->waiterId,
            'label' => $this->label,
            'kind' => $this->kind,
            'stage' => $this->stage,
            'stage_label' => $this->stageLabel,
        ];
    }
}
