<?php

namespace App\Http\Controllers;

use App\Http\Requests\Floor\StoreDiningTableRequest;
use App\Http\Requests\Floor\UpdateDiningTableRequest;
use App\Http\Resources\DiningTableResource;
use App\Http\Resources\ZoneResource;
use App\Models\Branch;
use App\Models\DiningTable;
use App\Models\Zone;
use App\Services\TableService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class DiningTableController extends Controller
{
    public function __construct(private readonly TableService $tables) {}

    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', DiningTable::class);

        $branchId = $this->branchId($request);

        return Inertia::render('tables/index', [
            'branches' => $this->branchOptions(),
            'branch_id' => $branchId,
            'zones' => ZoneResource::collection($this->tables->board($branchId))->resolve(),
        ]);
    }

    public function create(Request $request): Response
    {
        Gate::authorize('create', DiningTable::class);

        $branchId = $this->branchId($request);

        return Inertia::render('tables/create', [
            'branch' => Branch::findOrFail($branchId)->only(['id', 'name']),
            'zones' => $this->zoneOptions($branchId),
            'zone_id' => $request->integer('zone') ?: null,
        ]);
    }

    public function store(StoreDiningTableRequest $request): RedirectResponse
    {
        $table = $this->tables->createTable($request->validated());

        Inertia::flash('created_id', $table->id);

        return to_route('tables.index', ['branch' => $table->branch_id]);
    }

    public function edit(DiningTable $table): Response
    {
        Gate::authorize('update', $table);

        return Inertia::render('tables/edit', [
            'table' => (new DiningTableResource($table))->resolve(),
            'branch_id' => $table->branch_id,
            'zones' => $this->zoneOptions($table->branch_id),
        ]);
    }

    public function update(UpdateDiningTableRequest $request, DiningTable $table): RedirectResponse
    {
        $this->tables->updateTable($table, $request->validated());

        return to_route('tables.index', ['branch' => $table->branch_id]);
    }

    public function destroy(DiningTable $table): RedirectResponse
    {
        Gate::authorize('delete', $table);

        $this->tables->deleteTable($table);

        return to_route('tables.index', ['branch' => $table->branch_id]);
    }

    private function branchId(Request $request): int
    {
        $requested = $request->integer('branch');

        return Branch::findOrFail($requested ?: $request->user()->branch_id)->id;
    }

    /** @return array<int, array{id: int, name: string}> */
    private function branchOptions(): array
    {
        return array_map(
            fn (Branch $branch) => ['id' => $branch->id, 'name' => $branch->name],
            Branch::where('is_active', true)->orderBy('name')->get(['id', 'name'])->all(),
        );
    }

    /** @return array<int, array{id: int, name: string}> */
    private function zoneOptions(int $branchId): array
    {
        return array_map(
            fn (Zone $zone) => ['id' => $zone->id, 'name' => $zone->name],
            Zone::where('branch_id', $branchId)->where('is_active', true)->orderBy('sort_order')->get(['id', 'name'])->all(),
        );
    }
}
