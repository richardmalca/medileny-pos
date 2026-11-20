<?php

namespace App\Http\Controllers;

use App\Http\Requests\Cash\CloseCashRequest;
use App\Http\Requests\Cash\OpenCashRequest;
use App\Models\CashSession;
use App\Services\CashService;
use App\Support\Money;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class CashSessionController extends Controller
{
    public function __construct(private readonly CashService $cash) {}

    public function store(OpenCashRequest $request): RedirectResponse
    {
        $session = $this->cash->open($request->user(), Money::toCents($request->validated('opening')));

        Inertia::flash('created_id', $session->id);

        return back();
    }

    public function destroy(CashSession $session): RedirectResponse
    {
        Gate::authorize('undoOpen', $session);

        $this->cash->undoOpen($session);

        return back();
    }

    public function close(CloseCashRequest $request, CashSession $session): RedirectResponse
    {
        $this->cash->close($request->user(), $session, Money::toCents($request->validated('counted')));

        return back();
    }

    public function reopen(CashSession $session): RedirectResponse
    {
        Gate::authorize('reopen', $session);

        $this->cash->reopen($session);

        return back();
    }
}
