<?php

namespace App\Http\Controllers;

use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Enums\PaymentMethod;
use App\Enums\Permission;
use App\Models\DiningTable;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderRound;
use App\Models\Payment;
use App\Services\CashService;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(private readonly CashService $cash) {}

    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        $branchId = $user->branch_id;
        $canSeeSales = $user->can(Permission::ChargeSales->value);

        $todayOrders = Order::query()
            ->where('branch_id', $branchId)
            ->whereDate('created_at', today())
            ->where('status', '!=', OrderStatus::Cancelled->value)
            ->get(['id', 'type', 'status', 'total_cents']);

        $payments = $canSeeSales
            ? Payment::query()
                ->whereHas('order', fn ($query) => $query->where('branch_id', $branchId))
                ->whereNull('voided_at')
                ->whereDate('created_at', today())
                ->get(['method', 'amount_cents', 'created_at'])
            : collect();

        $session = $branchId === null ? null : $this->cash->current($branchId);
        $sales = (int) $payments->sum('amount_cents');
        $paidOrders = $todayOrders->where('status', OrderStatus::Paid)->count();

        return Inertia::render('dashboard', [
            'stats' => [
                'orders_today' => $todayOrders->count(),
                'open_orders' => Order::where('branch_id', $branchId)->where('status', OrderStatus::Open->value)->count(),
                'paid_orders' => $paidOrders,
                'sales_cents' => $canSeeSales ? $sales : null,
                'average_ticket_cents' => $canSeeSales && $paidOrders > 0 ? intdiv($sales, $paidOrders) : null,
                'cash_open' => $session !== null,
                'cash_expected_cents' => $canSeeSales && $session !== null
                    ? $this->cash->summary($session)['expected_cents']
                    : null,
                'tables_busy' => $this->busyTables($branchId),
                'tables_total' => DiningTable::query()
                    ->where('is_active', true)
                    ->whereHas('zone', fn ($query) => $query->where('branch_id', $branchId))
                    ->count(),
                'kitchen_minutes' => $this->kitchenMinutes($branchId),
                'kitchen_queue' => $this->kitchenQueue($branchId),
                'my_orders_today' => Order::query()
                    ->where('branch_id', $branchId)
                    ->where('user_id', $user->id)
                    ->whereDate('created_at', today())
                    ->where('status', '!=', OrderStatus::Cancelled->value)
                    ->count(),
                'by_method' => $canSeeSales ? $this->byMethod($payments) : null,
                'by_hour' => $canSeeSales ? $this->byHour($payments) : null,
                'by_type' => $this->byType($todayOrders),
                'top_products' => $this->topProducts($branchId),
            ],
        ]);
    }

    private function busyTables(?int $branchId): int
    {
        return DiningTable::query()
            ->where('is_active', true)
            ->whereHas('zone', fn ($query) => $query->where('branch_id', $branchId))
            ->whereHas('openOrders')
            ->count();
    }

    /**
     * Tandas pendientes según su etapa en cocina (las mismas que ve la cocina).
     *
     * @return array{new: int, received: int, preparing: int, ready: int}
     */
    private function kitchenQueue(?int $branchId): array
    {
        $rounds = OrderRound::query()
            ->whereHas('order', fn ($query) => $query
                ->where('branch_id', $branchId)
                ->where('status', '!=', OrderStatus::Cancelled->value))
            ->whereHas('items', fn ($query) => $query->where('needs_kitchen', true))
            ->whereNull('cancelled_at')
            ->whereNull('handed_at')
            ->get(['received_at', 'preparing_at', 'ready_at']);

        return [
            'new' => $rounds->whereNull('received_at')->count(),
            'received' => $rounds->whereNotNull('received_at')->whereNull('preparing_at')->count(),
            'preparing' => $rounds->whereNotNull('preparing_at')->whereNull('ready_at')->count(),
            'ready' => $rounds->whereNotNull('ready_at')->count(),
        ];
    }

    /** Minutos promedio desde que se envía una tanda hasta que cocina la entrega. */
    private function kitchenMinutes(?int $branchId): ?int
    {
        $rounds = OrderRound::query()
            ->whereHas('order', fn ($query) => $query->where('branch_id', $branchId))
            ->whereDate('sent_at', today())
            ->whereNull('cancelled_at')
            ->whereNotNull('ready_at')
            ->get(['sent_at', 'ready_at']);

        if ($rounds->isEmpty()) {
            return null;
        }

        return (int) round($rounds->avg(fn (OrderRound $round) => $round->sent_at->diffInMinutes($round->ready_at, true)));
    }

    /**
     * @param  Collection<int, Payment>  $payments
     * @return array<int, array{method: string, label: string, cents: int}>
     */
    private function byMethod(Collection $payments): array
    {
        return collect(PaymentMethod::cases())
            ->map(fn (PaymentMethod $method) => [
                'method' => $method->value,
                'label' => $method->label(),
                'cents' => (int) $payments->where('method', $method)->sum('amount_cents'),
            ])
            ->all();
    }

    /**
     * @param  Collection<int, Payment>  $payments
     * @return array<int, array{hour: int, cents: int}>
     */
    private function byHour(Collection $payments): array
    {
        $grouped = $payments->groupBy(fn (Payment $payment) => (int) $payment->created_at->format('G'));

        return collect(range(10, 23))
            ->map(fn (int $hour) => [
                'hour' => $hour,
                'cents' => (int) ($grouped->get($hour)?->sum('amount_cents') ?? 0),
            ])
            ->all();
    }

    /**
     * @param  Collection<int, Order>  $orders
     * @return array<int, array{type: string, label: string, count: int}>
     */
    private function byType(Collection $orders): array
    {
        return collect(OrderType::cases())
            ->map(fn (OrderType $type) => [
                'type' => $type->value,
                'label' => $type->label(),
                'count' => $orders->where('type', $type)->count(),
            ])
            ->all();
    }

    /** @return array<int, array{name: string, quantity: int}> */
    private function topProducts(?int $branchId): array
    {
        return OrderItem::query()
            ->whereNull('cancelled_at')
            ->whereHas('round', fn ($query) => $query->whereNull('cancelled_at'))
            ->whereHas('order', fn ($query) => $query
                ->where('branch_id', $branchId)
                ->where('status', '!=', OrderStatus::Cancelled->value)
                ->whereDate('created_at', today()))
            ->get(['product_name', 'quantity'])
            ->groupBy('product_name')
            ->map(fn (Collection $items, string $name) => [
                'name' => $name,
                'quantity' => (int) $items->sum('quantity'),
            ])
            ->sortByDesc('quantity')
            ->take(5)
            ->values()
            ->all();
    }
}
