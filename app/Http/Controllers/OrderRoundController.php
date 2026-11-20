<?php

namespace App\Http\Controllers;

use App\Http\Requests\Orders\AppendRoundRequest;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\OrderSummaryResource;
use App\Models\Order;
use App\Models\OrderRound;
use App\Services\MenuService;
use App\Services\OrderService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class OrderRoundController extends Controller
{
    public function __construct(
        private readonly OrderService $orders,
        private readonly MenuService $menu,
    ) {}

    public function create(Request $request, Order $order): Response
    {
        Gate::authorize('addRound', $order);

        $order->load(['tables', 'activeRounds.items']);

        return Inertia::render('orders/create', [
            'categories' => CategoryResource::collection($this->menu->catalog())->resolve(),
            'tables' => [],
            'order' => (new OrderSummaryResource($order))->resolve($request),
        ]);
    }

    public function store(AppendRoundRequest $request, Order $order): RedirectResponse
    {
        $round = $this->orders->addRound($request->user(), $order, $request->validated());

        Inertia::flash('created_id', $round->id);

        return $request->input('redirect') === 'floor'
            ? to_route('floor.index', ['order' => $order->id])
            : to_route('orders.show', $order);
    }

    public function cancel(OrderRound $round): RedirectResponse
    {
        Gate::authorize('cancelRound', $round);

        $this->orders->cancelRound($round);

        return back();
    }

    public function restore(OrderRound $round): RedirectResponse
    {
        Gate::authorize('restoreRound', $round);

        $this->orders->restoreRound($round);

        return back();
    }
}
