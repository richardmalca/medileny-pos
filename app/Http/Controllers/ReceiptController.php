<?php

namespace App\Http\Controllers;

use App\Http\Resources\ReceiptResource;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ReceiptController extends Controller
{
    public function __invoke(Request $request, Order $order): Response
    {
        Gate::authorize('viewReceipt', $order);

        $order->load(['tables', 'branch', 'payments.user', 'payments.session', 'payments.order', 'rounds.items', 'activeRounds.items']);

        return Inertia::render('orders/receipt', [
            'order' => (new ReceiptResource($order))->resolve($request),
        ]);
    }
}
