<?php

namespace App\Http\Controllers;

use App\Http\Requests\Floor\StoreZoneRequest;
use App\Models\Zone;
use App\Services\TableService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class ZoneController extends Controller
{
    public function __construct(private readonly TableService $tables) {}

    public function store(StoreZoneRequest $request): RedirectResponse
    {
        $zone = $this->tables->createZone($request->validated());

        Inertia::flash('created_id', $zone->id);

        return back();
    }

    public function destroy(Zone $zone): RedirectResponse
    {
        Gate::authorize('delete', $zone);

        $this->tables->deleteZone($zone);

        return back();
    }
}
