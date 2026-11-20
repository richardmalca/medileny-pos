<?php

namespace App\Http\Controllers;

use App\Http\Requests\Orders\StoreOrderRequest;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\OrderDetailResource;
use App\Models\DiningTable;
use App\Models\Order;
use App\Services\FloorService;
use App\Services\MenuService;
use App\Services\OrderService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function __construct(
        private readonly OrderService $orders,
        private readonly MenuService $menu,
        private readonly FloorService $floor,
    ) {}

    public function create(Request $request): Response|RedirectResponse
    {
        Gate::authorize('create', Order::class);

        $ids = array_map('intval', $request->array('tables'));
        $tables = $this->orders->freeTables($request->user(), $ids);

        if ($tables->count() !== count(array_unique($ids))) {
            return to_route('floor.index');
        }

        return Inertia::render('orders/create', [
            'categories' => CategoryResource::collection($this->menu->catalog())->resolve(),
            'tables' => $tables->map(fn (DiningTable $table) => [
                'id' => $table->id,
                'name' => $table->name,
                'capacity' => $table->capacity,
            ])->values()->all(),
            'order' => null,
        ]);
    }

    public function store(StoreOrderRequest $request): RedirectResponse
    {
        $round = $this->orders->open($request->user(), $request->validated());

        Inertia::flash('created_id', $round->id);

        return to_route('floor.index');
    }

    public function show(Request $request, Order $order): Response
    {
        Gate::authorize('view', $order);

        $order->load(['tables', 'branch', 'payments', 'activeRounds.items', 'rounds.items', 'rounds.user']);
        $branch = $order->branch;

        return Inertia::render('orders/show', [
            'order' => (new OrderDetailResource($order))->resolve($request),
            'can_add' => $request->user()->can('addRound', $order),
            'table_options' => $this->floor->tableOptions($request->user(), $order),
            'thresholds' => [
                'warn' => $branch->warn_after_minutes,
                'alert' => $branch->alert_after_minutes,
            ],
            'server_now' => now()->toIso8601String(),
        ]);
    }
}
