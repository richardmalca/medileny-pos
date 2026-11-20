<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

class FloorChanged implements ShouldBroadcast, ShouldDispatchAfterCommit
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(
        public readonly int $branchId,
        public readonly string $reason,
        public readonly ?int $orderId = null,
    ) {}

    /** @return list<PrivateChannel> */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("branch.{$this->branchId}.floor"),
            new PrivateChannel("branch.{$this->branchId}.cash"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'floor.changed';
    }

    /** @return array<string, mixed> */
    public function broadcastWith(): array
    {
        return ['reason' => $this->reason, 'order_id' => $this->orderId];
    }
}
