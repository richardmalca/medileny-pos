<?php

namespace App\Http\Controllers;

use App\Concerns\ResolvesCheckout;
use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Http\Resources\CashSessionResource;
use App\Http\Resources\OrderSummaryResource;
use App\Http\Resources\PaymentResource;
use App\Models\CashSession;
use App\Models\Order;
use App\Models\Payment;
use App\Services\CashService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class CashController extends Controller
{
    use ResolvesCheckout;

    public function __construct(private readonly CashService $cash) {}

    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', CashSession::class);

        $user = $request->user();
        $branch = $user->branch()->firstOrFail();
        $session = $this->cash->current($branch->id);

        return Inertia::render('cash/index', [
            'session' => $session ? $this->sessionData($session, $request) : null,
            'to_collect' => fn () => OrderSummaryResource::collection(
                Order::query()
                    ->where('branch_id', $branch->id)
                    ->where('status', OrderStatus::Open->value)
                    ->with(['tables', 'payments', 'activeRounds.items'])
                    ->orderBy('created_at')
                    ->get(),
            )->resolve($request),
            'recent_payments' => fn () => $session
                ? PaymentResource::collection(
                    Payment::query()
                        ->where('cash_session_id', $session->id)
                        ->with(['order.tables', 'order.payments', 'order.activeRounds', 'session', 'user'])
                        ->latest('id')
                        ->limit(10)
                        ->get(),
                )->resolve($request)
                : [],
            'history' => fn () => CashSession::query()
                ->where('branch_id', $branch->id)
                ->whereNotNull('closed_at')
                ->with('opener')
                ->latest('closed_at')
                ->limit(5)
                ->get()
                ->map(fn (CashSession $closed) => (new CashSessionResource($closed))->resolve($request))
                ->all(),
            'methods' => fn () => array_map(
                fn (PaymentMethod $method) => ['value' => $method->value, 'label' => $method->label()],
                PaymentMethod::cases(),
            ),
            'checkout' => fn () => $this->checkoutFor($request),
            'thresholds' => ['warn' => $branch->warn_after_minutes, 'alert' => $branch->alert_after_minutes],
            'server_now' => now()->toIso8601String(),
        ]);
    }

    /** @return array<string, mixed> */
    private function sessionData(CashSession $session, Request $request): array
    {
        $session->load('opener');

        return [
            ...(new CashSessionResource($session))->resolve($request),
            ...$this->cash->summary($session),
        ];
    }
}
