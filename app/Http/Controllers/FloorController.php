<?php

namespace App\Http\Controllers;

use App\Concerns\ResolvesCheckout;
use App\Enums\PaymentMethod;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\OrderDetailResource;
use App\Http\Resources\OrderSummaryResource;
use App\Http\Resources\ZoneResource;
use App\Models\Order;
use App\Services\CashService;
use App\Services\FloorService;
use App\Services\MenuService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class FloorController extends Controller
{
    use ResolvesCheckout;

    public function __construct(
        private readonly FloorService $floor,
        private readonly MenuService $menu,
        private readonly CashService $cash,
    ) {}

    public function index(Request $request): Response
    {
        Gate::authorize('create', Order::class);

        $user = $request->user();
        $branch = $user->branch()->firstOrFail();

        // La cuenta abierta se carga una sola vez, y solo si algún dato la pide.
        $loaded = [];
        $detail = function () use ($request, &$loaded): ?Order {
            return array_key_exists('order', $loaded)
                ? $loaded['order']
                : $loaded['order'] = $this->detail($request);
        };

        // Todo va en funciones: en una recarga parcial (abrir una cuenta o el
        // cobro) Inertia solo calcula lo que se pidió, no la carta ni el salón.
        return Inertia::render('floor/index', [
            'zones' => fn () => ZoneResource::collection($this->floor->zones($user))->resolve(),
            'categories' => fn () => CategoryResource::collection($this->menu->catalog())->resolve(),
            'loose_orders' => fn () => OrderSummaryResource::collection($this->floor->looseOrders($user))->resolve(),
            'thresholds' => [
                'warn' => $branch->warn_after_minutes,
                'alert' => $branch->alert_after_minutes,
            ],
            'detail' => fn () => ($order = $detail()) === null ? null : (new OrderDetailResource($order))->resolve($request),
            'can_add' => fn () => ($order = $detail()) !== null && $user->can('addRound', $order),
            'table_options' => fn () => ($order = $detail()) === null ? [] : $this->floor->tableOptions($user, $order),
            'checkout' => fn () => $this->checkoutFor($request),
            'methods' => fn () => array_map(
                fn (PaymentMethod $method) => ['value' => $method->value, 'label' => $method->label()],
                PaymentMethod::cases(),
            ),
            'cash_open' => fn () => $this->cash->current($branch->id) !== null,
            'server_now' => now()->toIso8601String(),
        ]);
    }

    private function detail(Request $request): ?Order
    {
        $id = $request->integer('order');

        if ($id <= 0) {
            return null;
        }

        $order = Order::query()
            ->where('branch_id', $request->user()->branch_id)
            ->with(['tables', 'branch', 'payments', 'activeRounds.items', 'rounds.items', 'rounds.user'])
            ->find($id);

        return $order !== null && $request->user()->can('view', $order) ? $order : null;
    }
}
