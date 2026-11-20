<?php

namespace App\Http\Controllers;

use App\Http\Requests\Orders\MoveTablesRequest;
use App\Http\Requests\Orders\ServeItemsRequest;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;

class OrderChangeController extends Controller
{
    public function __construct(private readonly OrderService $orders) {}

    public function moveTables(MoveTablesRequest $request, Order $order): RedirectResponse
    {
        $this->orders->moveTables($order, array_map('intval', $request->validated('table_ids')));

        return back();
    }

    public function serve(ServeItemsRequest $request, Order $order): RedirectResponse
    {
        $this->orders->setServed(
            $order,
            array_map('intval', $request->validated('item_ids')),
            $request->boolean('served'),
        );

        return back();
    }

    public function cancel(Order $order): RedirectResponse
    {
        Gate::authorize('cancel', $order);

        $this->orders->cancelOrder($order);

        return back();
    }

    public function restore(Order $order): RedirectResponse
    {
        Gate::authorize('restore', $order);

        $this->orders->restoreOrder($order);

        return back();
    }
}
