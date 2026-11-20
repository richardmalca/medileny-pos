<?php

namespace App\Http\Controllers;

use App\Http\Resources\KitchenTicketResource;
use App\Models\Order;
use App\Services\KitchenService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class KitchenController extends Controller
{
    public function __construct(private readonly KitchenService $kitchen) {}

    public function index(Request $request): Response
    {
        Gate::authorize('viewKitchen', Order::class);

        $branch = $request->user()->branch()->firstOrFail();

        return Inertia::render('kitchen/index', [
            'tickets' => KitchenTicketResource::collection($this->kitchen->board($request->user()))->resolve($request),
            'thresholds' => ['warn' => $branch->warn_after_minutes, 'alert' => $branch->alert_after_minutes],
            'server_now' => now()->toIso8601String(),
        ]);
    }
}
