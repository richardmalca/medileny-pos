import { Head, Link, usePoll } from '@inertiajs/react';
import { ShoppingBag } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ElapsedBadge } from '@/components/floor/elapsed-badge';
import { SelectionBar } from '@/components/floor/selection-bar';
import { TableCard } from '@/components/floor/table-card';
import { Button } from '@/components/ui/button';
import { PosWorkspace } from '@/components/workspace/pos-workspace';
import { useNow } from '@/hooks/use-now';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import { index } from '@/routes/floor';
import { create, show } from '@/routes/orders';
import type {
    OrderDetail,
    OrderSummary,
    TableOptionZone,
    Thresholds,
    Zone,
} from '@/types/floor';
import type { MethodOption, ReceiptOrder } from '@/types/cash';
import type { Category } from '@/types/menu';

type Props = {
    zones: Zone[];
    categories: Category[];
    loose_orders: OrderSummary[];
    detail: OrderDetail | null;
    table_options: TableOptionZone[];
    checkout: ReceiptOrder | null;
    cash_open: boolean;
    methods: MethodOption[];
    thresholds: Thresholds;
    server_now: string;
};

export default function FloorIndex({
    zones,
    categories,
    loose_orders: looseOrders,
    detail,
    table_options: tableOptions,
    checkout,
    cash_open: cashOpen,
    methods,
    thresholds,
    server_now: serverNow,
}: Props) {
    usePoll(30000, {
        only: [
            'zones',
            'loose_orders',
            'detail',
            'can_add',
            'table_options',
            'checkout',
            'thresholds',
            'server_now',
        ],
    });

    const now = useNow(serverNow);
    const [zoneId, setZoneId] = useState<number | null>(null);
    const [selected, setSelected] = useState<number[]>([]);

    const freeTables = useMemo(
        () =>
            zones
                .flatMap((zone) => zone.tables)
                .filter((table) => table.order === null),
        [zones],
    );

    const chosen = freeTables.filter((table) => selected.includes(table.id));
    const visible = zones.filter(
        (zone) => zoneId === null || zone.id === zoneId,
    );

    const zoneOf = (id: number) =>
        zones.find((zone) => zone.tables.some((table) => table.id === id));

    const toggle = (id: number) => {
        const locked = chosen.length > 0 ? zoneOf(chosen[0].id) : undefined;

        if (!selected.includes(id) && locked && zoneOf(id)?.id !== locked.id) {
            toast.error(
                `Solo puedes juntar mesas de la misma zona (${locked.name}).`,
            );

            return;
        }

        setSelected((current) =>
            current.includes(id)
                ? current.filter((value) => value !== id)
                : [...current, id],
        );
    };

    return (
        <>
            <Head title="Mesas" />

            <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 pb-28 lg:hidden">
                <header className="flex items-end justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold text-muted-foreground">
                            {freeTables.length} mesas libres
                        </p>
                        <h1 className="display text-4xl md:text-4xl">Mesas</h1>
                    </div>
                    <Button
                        asChild
                        size="lg"
                        variant="outline"
                        className="h-12 gap-2 rounded-2xl font-bold"
                    >
                        <Link href={create()}>
                            <ShoppingBag className="size-5" />
                            Llevar / Delivery
                        </Link>
                    </Button>
                </header>

                <div
                    role="tablist"
                    aria-label="Zonas"
                    className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0"
                >
                    {[{ id: null, name: 'Todas' }, ...zones].map((zone) => (
                        <button
                            key={zone.id ?? 'all'}
                            type="button"
                            role="tab"
                            aria-selected={zoneId === zone.id}
                            onClick={() => setZoneId(zone.id)}
                            className={cn(
                                'min-h-11 shrink-0 rounded-full px-4 text-sm font-bold ring-1 ring-border transition-colors duration-150 active:scale-95',
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
                    <section
                        key={zone.id}
                        aria-labelledby={`zone-${zone.id}`}
                        className="flex flex-col gap-3"
                    >
                        <h2 id={`zone-${zone.id}`} className="display text-2xl">
                            {zone.name}
                        </h2>
                        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                            {zone.tables.map((table) => (
                                <li key={table.id}>
                                    <TableCard
                                        table={table}
                                        selected={selected.includes(table.id)}
                                        onToggle={toggle}
                                        now={now}
                                        thresholds={thresholds}
                                    />
                                </li>
                            ))}
                        </ul>
                    </section>
                ))}

                {looseOrders.length > 0 && (
                    <section
                        aria-labelledby="loose-orders"
                        className="flex flex-col gap-3"
                    >
                        <h2 id="loose-orders" className="display text-2xl">
                            Para llevar y delivery
                        </h2>
                        <ul className="grid gap-3 md:grid-cols-2">
                            {looseOrders.map((order) => (
                                <li key={order.id}>
                                    <Link
                                        href={show(order.id)}
                                        prefetch
                                        className="flex items-center justify-between gap-3 rounded-3xl bg-card p-4 ring-1 ring-border transition-transform duration-150 active:scale-[0.98]"
                                    >
                                        <span className="min-w-0">
                                            <span className="block truncate font-bold">
                                                {order.label}
                                            </span>
                                            <span className="block truncate text-sm text-muted-foreground">
                                                {order.customer_name ??
                                                    `${order.items_count} ítems`}
                                            </span>
                                            <ElapsedBadge
                                                since={order.waiting_since}
                                                now={now}
                                                thresholds={thresholds}
                                            />
                                        </span>
                                        <span className="display text-xl text-primary">
                                            {formatMoney(order.total_cents)}
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
            </div>

            <div className="lg:hidden">
                <SelectionBar tables={chosen} onClear={() => setSelected([])} />
            </div>

            <div className="hidden lg:block">
                <PosWorkspace
                    zones={zones}
                    looseOrders={looseOrders}
                    categories={categories}
                    detail={detail}
                    tableOptions={tableOptions}
                    checkout={checkout}
                    cashOpen={cashOpen}
                    methods={methods}
                    now={now}
                    thresholds={thresholds}
                />
            </div>
        </>
    );
}

FloorIndex.layout = {
    breadcrumbs: [{ title: 'Mesas', href: index() }],
};
