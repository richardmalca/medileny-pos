<?php

namespace App\Http\Controllers;

use App\Enums\OrderStatus;
use App\Http\Requests\Cash\StorePaymentRequest;
use App\Models\Order;
use App\Models\Payment;
use App\Services\PaymentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class PaymentController extends Controller
{
    public function __construct(private readonly PaymentService $payments) {}

    public function store(StorePaymentRequest $request, Order $order): RedirectResponse
    {
        $payment = $this->payments->charge($request->user(), $order, $request->validated());

        Inertia::flash('created_id', $payment->id);

        return ! $request->boolean('inline') && $order->refresh()->status === OrderStatus::Paid
            ? to_route('orders.receipt', $order)
            : back();
    }

    public function void(Request $request, Payment $payment): RedirectResponse
    {
        Gate::authorize('void', $payment);

        $this->payments->void($request->user(), $payment);

        return back();
    }
}
