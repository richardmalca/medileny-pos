import { Link } from '@inertiajs/react';
import { Check, Users } from 'lucide-react';
import { ElapsedBadge } from '@/components/floor/elapsed-badge';
import { KitchenBadge } from '@/components/kitchen/kitchen-badge';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import { show } from '@/routes/orders';
import type { FloorTable, Thresholds } from '@/types/floor';

const base =
    'relative flex min-h-28 w-full flex-col justify-between gap-2 rounded-3xl p-4 text-left ring-1 ring-border transition-transform duration-150 active:scale-[0.97]';

export function TableCard({
    table,
    selected,
    onToggle,
    now,
    thresholds,
}: {
    table: FloorTable;
    selected: boolean;
    onToggle: (id: number) => void;
    now: number;
    thresholds: Thresholds;
}) {
    const order = table.order;

    const header = (
        <span className="flex items-start justify-between gap-2">
            <span className="display text-2xl leading-none">{table.name}</span>
            <span
                className={cn(
                    'flex items-center gap-1 text-sm font-semibold',
                    order ? 'text-white/85' : 'text-muted-foreground',
                )}
            >
                <Users className="size-4" />
                {table.capacity}
            </span>
        </span>
    );

    if (order) {
        const joined = order.table_names.filter((name) => name !== table.name);

        return (
            <Link
                href={show(order.id)}
                prefetch
                className={cn(
                    base,
                    'bg-brand-gradient text-white ring-transparent',
                )}
            >
                {header}
                <span className="flex flex-col gap-1">
                    {joined.length > 0 && (
                        <span className="text-xs font-semibold text-white/85">
                            Unida con {joined.join(' + ')}
                        </span>
                    )}
                    {order.kitchen_stage !== null && (
                        <span className="w-fit rounded-full bg-white">
                            <KitchenBadge
                                stage={order.kitchen_stage}
                                label={order.kitchen_label}
                            />
                        </span>
                    )}
                    {order.type !== 'dine_in' && (
                        <span className="text-xs font-semibold text-white/85">
                            {order.type_label}
                        </span>
                    )}
                    <span className="flex flex-wrap items-center justify-between gap-2">
                        <span className="rounded-full bg-white">
                            <ElapsedBadge
                                since={order.waiting_since}
                                now={now}
                                thresholds={thresholds}
                            />
                        </span>
                        <span className="display text-xl">
                            {formatMoney(order.total_cents)}
                        </span>
                    </span>
                </span>
            </Link>
        );
    }

    return (
        <button
            type="button"
            aria-pressed={selected}
            onClick={() => onToggle(table.id)}
            className={cn(base, 'bg-card', selected && 'ring-2 ring-primary')}
        >
            {header}
            <span className="flex items-center justify-between">
                <span className="text-sm font-semibold text-muted-foreground">
                    Libre
                </span>
                {selected && (
                    <span className="grid size-7 place-items-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-4" />
                    </span>
                )}
            </span>
        </button>
    );
}
