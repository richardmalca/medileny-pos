<?php

namespace App\Http\Controllers;

use App\Models\OrderItem;
use App\Services\OrderService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;

class OrderItemController extends Controller
{
    public function __construct(private readonly OrderService $orders) {}

    public function cancel(OrderItem $item): RedirectResponse
    {
        Gate::authorize('cancelItem', $item);

        $this->orders->cancelItem($item);

        return back();
    }

    public function restore(OrderItem $item): RedirectResponse
    {
        Gate::authorize('restoreItem', $item);

        $this->orders->restoreItem($item);

        return back();
    }
}
