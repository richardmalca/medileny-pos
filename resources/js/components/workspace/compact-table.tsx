import { Users } from 'lucide-react';
import { formatMinutes, minutesSince, urgencyOf } from '@/lib/time';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { FloorTable, Thresholds } from '@/types/floor';

const urgencyDot = {
    ok: 'bg-brand-green',
    warn: 'bg-brand-yellow',
    alert: 'bg-white ring-2 ring-destructive',
};

export function CompactTable({
    table,
    selected,
    active,
    dimmed = false,
    onSelect,
    now,
    thresholds,
}: {
    table: FloorTable;
    selected: boolean;
    active: boolean;
    /** Mesa de otra zona: no se puede juntar con las ya elegidas. */
    dimmed?: boolean;
    onSelect: (table: FloorTable) => void;
    now: number;
    thresholds: Thresholds;
}) {
    const order = table.order;
    const minutes = order?.waiting_since
        ? minutesSince(order.waiting_since, now)
        : null;
    const ready = order?.kitchen_stage === 3;

    return (
        <button
            type="button"
            aria-pressed={selected || active}
            onClick={() => onSelect(table)}
            className={cn(
                'flex min-h-16 w-full min-w-0 flex-col justify-between gap-1 overflow-hidden rounded-xl p-2 text-left ring-1 ring-border transition-transform duration-150 active:scale-95',
                order
                    ? 'bg-brand-gradient text-white ring-transparent'
                    : 'bg-card',
                selected && 'bg-primary/10 ring-2 ring-primary',
                dimmed && 'opacity-40',
                active &&
                    'ring-2 ring-foreground ring-offset-2 ring-offset-background',
            )}
        >
            <span className="flex items-center justify-between gap-1">
                <span className="display min-w-0 truncate text-base leading-none">
                    {table.name}
                </span>
                <span
                    className={cn(
                        'flex items-center gap-0.5 text-xs font-semibold',
                        order ? 'text-white/85' : 'text-muted-foreground',
                    )}
                >
                    <Users className="size-3" />
                    {table.capacity}
                </span>
            </span>
            {order ? (
                <span className="flex flex-col gap-0.5 text-xs font-semibold">
                    {ready && (
                        <span className="w-fit rounded-full bg-white px-1.5 py-0.5 text-brand-green">
                            Listo en cocina
                        </span>
                    )}
                    <span className="flex flex-col gap-0.5">
                        {minutes !== null && (
                            <span className="flex items-center gap-1 whitespace-nowrap">
                                <span
                                    className={cn(
                                        'size-2 shrink-0 rounded-full',
                                        urgencyDot[
                                            urgencyOf(minutes, thresholds)
                                        ],
                                    )}
                                />
                                {formatMinutes(minutes)}
                            </span>
                        )}
                        <span className="display text-sm leading-none whitespace-nowrap">
                            {formatMoney(order.total_cents)}
                        </span>
                    </span>
                </span>
            ) : (
                <span className="text-xs font-semibold text-muted-foreground">
                    {selected ? 'Elegida' : 'Libre'}
                </span>
            )}
        </button>
    );
}
