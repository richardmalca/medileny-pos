<?php

namespace App\Http\Controllers;

use App\Enums\PaymentMethod;
use App\Http\Resources\ReceiptResource;
use App\Models\Order;
use App\Services\CashService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutController extends Controller
{
    public function __construct(private readonly CashService $cash) {}

    public function show(Request $request, Order $order): Response
    {
        Gate::authorize('charge', $order);

        $order->load(['tables', 'branch', 'payments.user', 'payments.session', 'payments.order', 'rounds.items', 'activeRounds.items']);

        return Inertia::render('orders/checkout', [
            'order' => (new ReceiptResource($order))->resolve($request),
            'session_open' => $this->cash->current($order->branch_id) !== null,
            'methods' => array_map(
                fn (PaymentMethod $method) => ['value' => $method->value, 'label' => $method->label()],
                PaymentMethod::cases(),
            ),
        ]);
    }
}
