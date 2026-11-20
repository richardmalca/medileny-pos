<?php

namespace App\Services;

use App\Events\FloorChanged;
use App\Models\DiningTable;
use App\Models\Zone;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Validation\ValidationException;

class TableService
{
    /** @return Collection<int, Zone> */
    public function board(int $branchId): Collection
    {
        return Zone::query()
            ->where('branch_id', $branchId)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->with('tables')
            ->get();
    }

    /** @param array<string, mixed> $data */
    public function createZone(array $data): Zone
    {
        $zone = Zone::create([
            'branch_id' => $data['branch_id'],
            'name' => $data['name'],
            'sort_order' => 1 + (int) Zone::where('branch_id', $data['branch_id'])->max('sort_order'),
            'is_active' => true,
        ]);

        FloorChanged::dispatch($zone->branch_id, 'tables');

        return $zone;
    }

    /** @param array<string, mixed> $data */
    public function createTable(array $data): DiningTable
    {
        $table = DiningTable::create([
            'branch_id' => $data['branch_id'],
            'zone_id' => $data['zone_id'],
            'name' => $data['name'],
            'capacity' => $data['capacity'],
            'sort_order' => 1 + (int) DiningTable::where('branch_id', $data['branch_id'])->max('sort_order'),
            'is_active' => true,
        ]);

        FloorChanged::dispatch($table->branch_id, 'tables');

        return $table;
    }

    /** @param array<string, mixed> $data */
    public function updateTable(DiningTable $table, array $data): DiningTable
    {
        $table->update([
            'zone_id' => $data['zone_id'],
            'name' => $data['name'],
            'capacity' => $data['capacity'],
        ]);

        FloorChanged::dispatch($table->branch_id, 'tables');

        return $table;
    }

    public function setTableActive(DiningTable $table, bool $active): DiningTable
    {
        if (! $active && $table->openOrders()->exists()) {
            throw ValidationException::withMessages(['is_active' => "La {$table->name} está ocupada y no se puede archivar."]);
        }

        $table->update(['is_active' => $active]);

        FloorChanged::dispatch($table->branch_id, 'tables');

        return $table;
    }

    public function setZoneActive(Zone $zone, bool $active): Zone
    {
        $occupied = DiningTable::where('zone_id', $zone->id)->whereHas('openOrders')->exists();

        if (! $active && $occupied) {
            throw ValidationException::withMessages(['is_active' => 'La zona tiene mesas ocupadas y no se puede archivar.']);
        }

        $zone->update(['is_active' => $active]);

        FloorChanged::dispatch($zone->branch_id, 'tables');

        return $zone;
    }

    public function deleteTable(DiningTable $table): void
    {
        $table->delete();

        FloorChanged::dispatch($table->branch_id, 'tables');
    }

    public function deleteZone(Zone $zone): void
    {
        $zone->delete();

        FloorChanged::dispatch($zone->branch_id, 'tables');
    }
}
