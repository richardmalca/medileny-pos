import { Search } from 'lucide-react';
import { useState } from 'react';
import { ElapsedBadge } from '@/components/floor/elapsed-badge';
import { CompactTable } from '@/components/workspace/compact-table';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { formatMoney } from '@/lib/money';
import type { FloorTable, OrderSummary, Thresholds, Zone } from '@/types/floor';

export function SalonPane({
    zones,
    looseOrders,
    onSelectLoose,
    selected,
    activeOrderId,
    lockedZoneId,
    onSelect,
    now,
    thresholds,
}: {
    zones: Zone[];
    looseOrders: OrderSummary[];
    onSelectLoose: (order: OrderSummary) => void;
    selected: number[];
    activeOrderId: number | null;
    lockedZoneId: number | null;
    onSelect: (table: FloorTable) => void;
    now: number;
    thresholds: Thresholds;
}) {
    const [zoneId, setZoneId] = useState<number | null>(null);
    const [search, setSearch] = useState('');
    const term = search.trim().toLowerCase();
    const visible = zones
        .filter((zone) => zoneId === null || zone.id === zoneId)
        .map((zone) => ({
            ...zone,
            tables: zone.tables.filter(
                (table) =>
                    term === '' || table.name.toLowerCase().includes(term),
            ),
        }))
        .filter((zone) => zone.tables.length > 0);
    const matches = visible.flatMap((zone) => zone.tables);
    const free = zones
        .flatMap((zone) => zone.tables)
        .filter((table) => !table.order).length;

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <h2 className="display text-xl">Salón</h2>
                <span className="text-xs font-semibold text-muted-foreground">
                    {free} libres
                </span>
            </div>

            <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter' && matches.length === 1) {
                            onSelect(matches[0]);
                            setSearch('');
                        }
                    }}
                    placeholder="Buscar mesa (ej. 12)"
                    aria-label="Buscar mesa"
                    className="h-9 rounded-full pl-9"
                />
            </div>

            <div
                role="tablist"
                aria-label="Zonas"
                className="flex flex-wrap gap-1.5"
            >
                {[{ id: null, name: 'Todas' }, ...zones].map((zone) => (
                    <button
                        key={zone.id ?? 'all'}
                        type="button"
                        role="tab"
                        aria-selected={zoneId === zone.id}
                        onClick={() => setZoneId(zone.id)}
                        className={cn(
                            'rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-border transition-colors duration-150',
                            zoneId === zone.id
                                ? 'bg-primary text-primary-foreground ring-transparent'
                                : 'bg-card',
                        )}
                    >
                        {zone.name}
                    </button>
                ))}
            </div>

            {visible.map((zone) => (
                <section key={zone.id} className="flex flex-col gap-2">
                    <h3 className="text-sm font-bold text-muted-foreground">
                        {zone.name}
                    </h3>
                    <ul className="grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-1.5">
                        {zone.tables.map((table) => (
                            <li key={table.id} className="min-w-0">
                                <CompactTable
                                    table={table}
                                    selected={selected.includes(table.id)}
                                    active={table.order?.id === activeOrderId}
                                    dimmed={
                                        lockedZoneId !== null &&
                                        zone.id !== lockedZoneId &&
                                        !table.order
                                    }
                                    onSelect={onSelect}
                                    now={now}
                                    thresholds={thresholds}
                                />
                            </li>
                        ))}
                    </ul>
                </section>
            ))}

            {looseOrders.length > 0 && term === '' && zoneId === null && (
                <section className="flex flex-col gap-2">
                    <h3 className="text-sm font-bold text-muted-foreground">
                        Sin mesa · {looseOrders.length}
                    </h3>
                    <ul className="flex flex-col gap-1.5">
                        {looseOrders.map((order) => (
                            <li key={order.id}>
                                <button
                                    type="button"
                                    onClick={() => onSelectLoose(order)}
                                    aria-pressed={order.id === activeOrderId}
                                    className={cn(
                                        'bg-brand-gradient flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left text-white transition-transform duration-150 active:scale-[0.98]',
                                        order.id === activeOrderId &&
                                            'ring-2 ring-foreground ring-offset-2 ring-offset-background',
                                    )}
                                >
                                    <span className="min-w-0">
                                        <span className="display block truncate text-sm leading-tight">
                                            {order.label}
                                        </span>
                                        {order.waiting_since && (
                                            <span className="text-[11px] text-white/85">
                                                <ElapsedBadge
                                                    since={order.waiting_since}
                                                    now={now}
                                                    thresholds={thresholds}
                                                    prefix=""
                                                />
                                            </span>
                                        )}
                                    </span>
                                    <span className="display shrink-0 text-sm">
                                        {formatMoney(order.total_cents)}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {visible.length === 0 && looseOrders.length === 0 && (
                <p className="rounded-2xl bg-card p-4 text-center text-sm text-muted-foreground ring-1 ring-border">
                    No hay mesas con ese número.
                </p>
            )}
        </div>
    );
}
