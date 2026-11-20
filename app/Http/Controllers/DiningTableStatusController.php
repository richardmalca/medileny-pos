<?php

namespace App\Http\Controllers;

use App\Models\DiningTable;
use App\Services\TableService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class DiningTableStatusController extends Controller
{
    public function __invoke(Request $request, DiningTable $table, TableService $tables): RedirectResponse
    {
        Gate::authorize('update', $table);

        $tables->setTableActive($table, $request->boolean('is_active'));

        return back();
    }
}
