<?php

namespace App\Http\Controllers;

use App\Models\Zone;
use App\Services\TableService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ZoneStatusController extends Controller
{
    public function __invoke(Request $request, Zone $zone, TableService $tables): RedirectResponse
    {
        Gate::authorize('update', $zone);

        $tables->setZoneActive($zone, $request->boolean('is_active'));

        return back();
    }
}
