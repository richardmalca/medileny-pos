<?php

namespace App\Concerns;

use App\Http\Resources\ReceiptResource;
use App\Models\Order;
use Illuminate\Http\Request;

trait ResolvesCheckout
{
    /**
     * Datos de la cuenta que se está cobrando (`?pay=ID`) para el diálogo de cobro.
     *
     * @return array<string, mixed>|null
     */
    protected function checkoutFor(Request $request): ?array
    {
        $id = $request->integer('pay');

        if ($id <= 0) {
            return null;
        }

        $order = Order::query()
            ->where('branch_id', $request->user()->branch_id)
            ->with(['tables', 'branch', 'payments.user', 'payments.session', 'payments.order', 'rounds.items', 'activeRounds.items'])
            ->find($id);

        if ($order === null || ! $request->user()->can('charge', $order)) {
            return null;
        }

        return (new ReceiptResource($order))->resolve($request);
    }
}
