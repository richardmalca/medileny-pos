import { Head, Link, usePage } from '@inertiajs/react';
import {
    Armchair,
    BellRing,
    ChefHat,
    Flame,
    Drumstick,
    HandCoins,
    Receipt,
    TicketCheck,
    Wallet,
} from 'lucide-react';
import type { ComponentType, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { useCan } from '@/hooks/use-can';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import { index as cash } from '@/routes/cash';
import { index as floor } from '@/routes/floor';
import { index as kitchen } from '@/routes/kitchen';

type Stats = {
    orders_today: number;
    open_orders: number;
    paid_orders: number;
    sales_cents: number | null;
    average_ticket_cents: number | null;
    cash_open: boolean;
    cash_expected_cents: number | null;
    tables_busy: number;
    tables_total: number;
    kitchen_minutes: number | null;
    kitchen_queue: {
        new: number;
        received: number;
        preparing: number;
        ready: number;
    };
    my_orders_today: number;
    by_method: { method: string; label: string; cents: number }[] | null;
    by_hour: { hour: number; cents: number }[] | null;
    by_type: { type: string; label: string; count: number }[];
    top_products: { name: string; quantity: number }[];
};

function greeting(hour: number): string {
    if (hour < 12) {
        return '¡Buenos días';
    }

    return hour < 19 ? '¡Buenas tardes' : '¡Buenas noches';
}

const methodColor: Record<string, string> = {
    cash: 'bg-brand-green',
    yape: 'bg-brand-orange',
    plin: 'bg-brand-yellow',
    card: 'bg-primary',
};

function Tile({
    icon: Icon,
    tone,
    label,
    value,
    hint,
}: {
    icon: ComponentType<{ className?: string }>;
    tone: string;
    label: string;
    value: ReactNode;
    hint?: ReactNode;
}) {
    return (
        <div className="flex flex-col items-start gap-2 rounded-2xl bg-card p-3 ring-1 ring-border sm:flex-row sm:items-center sm:gap-3 sm:p-4">
            <span
                className={cn(
                    'grid size-9 shrink-0 place-items-center rounded-xl sm:size-11',
                    tone,
                )}
            >
                <Icon className="size-5" />
            </span>
            <div className="min-w-0">
                <p className="text-xs leading-tight font-semibold text-muted-foreground">
                    {label}
                </p>
                <p className="display text-xl leading-tight whitespace-nowrap sm:text-2xl">
                    {value}
                </p>
                {hint && (
                    <p className="text-xs leading-tight text-muted-foreground">
                        {hint}
                    </p>
                )}
            </div>
        </div>
    );
}

function Card({
    title,
    children,
    className,
}: {
    title: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <section
            aria-label={title}
            className={cn(
                'flex flex-col gap-3 rounded-2xl bg-card p-4 ring-1 ring-border',
                className,
            )}
        >
            <h2 className="display text-lg">{title}</h2>
            {children}
        </section>
    );
}

function HourBars({ data }: { data: { hour: number; cents: number }[] }) {
    const max = Math.max(...data.map((item) => item.cents), 1);

    return (
        <div
            className="flex h-24 items-end gap-1"
            role="img"
            aria-label="Ventas por hora"
        >
            {data.map((item) => (
                <div
                    key={item.hour}
                    className="flex h-full flex-1 flex-col items-center justify-end gap-1"
                    title={`${item.hour}:00 · ${formatMoney(item.cents)}`}
                >
                    <div
                        className="w-full rounded-t-md bg-white/85"
                        style={{
                            height: `${Math.max((item.cents / max) * 100, item.cents > 0 ? 8 : 3)}%`,
                            opacity: item.cents > 0 ? 1 : 0.35,
                        }}
                    />
                    <span className="text-[10px] leading-none text-white/80">
                        {item.hour}
                    </span>
                </div>
            ))}
        </div>
    );
}

export default function Dashboard({ stats }: { stats: Stats }) {
    const { auth, branch } = usePage().props;
    const firstName = auth.user.name.split(' ')[0];
    const can = useCan();

    const methodTotal = Math.max(
        (stats.by_method ?? []).reduce((sum, item) => sum + item.cents, 0),
        1,
    );
    const typeTotal = Math.max(
        stats.by_type.reduce((sum, item) => sum + item.count, 0),
        1,
    );
    const isMoney = stats.sales_cents !== null && stats.by_hour !== null;
    const isKitchenOnly = !isMoney && !can('sales.create');
    const queue = stats.kitchen_queue;
    const inKitchen = queue.new + queue.received + queue.preparing;
    const topMax = Math.max(...stats.top_products.map((p) => p.quantity), 1);

    return (
        <>
            <Head title="Inicio" />

            <div className="flex w-full flex-col gap-4 pb-6">
                <header className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <p className="text-sm font-semibold text-muted-foreground">
                            {branch?.name}
                        </p>
                        <h1 className="display text-3xl md:text-3xl">
                            {greeting(new Date().getHours())}, {firstName}!
                        </h1>
                    </div>
                    {can('sales.create') && (
                        <Button
                            asChild
                            size="lg"
                            className="hidden h-12 gap-2 rounded-xl font-bold md:inline-flex"
                        >
                            <Link href={floor()}>
                                <Drumstick className="size-5" />
                                Nueva venta
                            </Link>
                        </Button>
                    )}
                </header>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
                    {isMoney &&
                    stats.by_hour !== null &&
                    stats.sales_cents !== null ? (
                        <section
                            aria-label="Ventas de hoy"
                            className="bg-brand-gradient flex flex-col gap-4 rounded-3xl p-5 text-white shadow-lg"
                        >
                            <div>
                                <p className="text-sm font-semibold text-white/85">
                                    Ventas de hoy
                                </p>
                                <p className="display text-5xl md:text-6xl">
                                    {formatMoney(stats.sales_cents)}
                                </p>
                                <p className="text-sm text-white/85">
                                    {stats.sales_cents === 0
                                        ? 'Aún no hay cobros registrados hoy.'
                                        : 'Cobros de hoy, sin contar anulaciones.'}
                                </p>
                            </div>
                            <HourBars data={stats.by_hour} />
                        </section>
                    ) : isKitchenOnly ? (
                        <section
                            aria-label="En cocina ahora"
                            className="bg-brand-gradient flex flex-col gap-1 rounded-3xl p-5 text-white shadow-lg"
                        >
                            <p className="text-sm font-semibold text-white/85">
                                En cocina ahora
                            </p>
                            <p className="display text-6xl">{inKitchen}</p>
                            <p className="text-sm text-white/85">
                                {queue.new + queue.received} por preparar ·{' '}
                                {queue.preparing} preparando · {queue.ready}{' '}
                                listos
                            </p>
                            <Button
                                asChild
                                className="mt-3 h-11 w-fit gap-2 rounded-xl bg-white font-bold text-foreground hover:bg-white/90"
                            >
                                <Link href={kitchen()}>
                                    <ChefHat className="size-5" />
                                    Ir a la cocina
                                </Link>
                            </Button>
                        </section>
                    ) : (
                        <section
                            aria-label="Mis pedidos de hoy"
                            className="bg-brand-gradient flex flex-col gap-1 rounded-3xl p-5 text-white shadow-lg"
                        >
                            <p className="text-sm font-semibold text-white/85">
                                Mis pedidos de hoy
                            </p>
                            <p className="display text-6xl">
                                {stats.my_orders_today}
                            </p>
                            <p className="text-sm text-white/85">
                                {stats.open_orders} cuentas abiertas en el local
                            </p>
                        </section>
                    )}

                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                        {isMoney && (
                            <>
                                <Tile
                                    icon={Receipt}
                                    tone="bg-brand-yellow/60 text-accent-foreground"
                                    label="Pedidos de hoy"
                                    value={stats.orders_today}
                                    hint={`${stats.open_orders} abiertos`}
                                />
                                <Tile
                                    icon={TicketCheck}
                                    tone="bg-brand-green/20 text-brand-green"
                                    label="Cobrados"
                                    value={stats.paid_orders}
                                    hint={
                                        stats.average_ticket_cents !== null
                                            ? `Ticket ${formatMoney(stats.average_ticket_cents)}`
                                            : 'Sin cobros aún'
                                    }
                                />
                            </>
                        )}
                        {!isKitchenOnly && (
                            <Tile
                                icon={Armchair}
                                tone="bg-primary/15 text-primary"
                                label="Mesas ocupadas"
                                value={`${stats.tables_busy}/${stats.tables_total}`}
                                hint={`${Math.max(stats.tables_total - stats.tables_busy, 0)} libres`}
                            />
                        )}
                        {!isMoney && !isKitchenOnly && (
                            <>
                                <Tile
                                    icon={Receipt}
                                    tone="bg-brand-yellow/60 text-accent-foreground"
                                    label="Pedidos del local"
                                    value={stats.orders_today}
                                    hint={`${stats.open_orders} abiertos`}
                                />
                                <Tile
                                    icon={BellRing}
                                    tone="bg-brand-green/20 text-brand-green"
                                    label="Listos para entregar"
                                    value={queue.ready}
                                    hint="Esperan al mozo"
                                />
                            </>
                        )}
                        {isKitchenOnly && (
                            <>
                                <Tile
                                    icon={Receipt}
                                    tone="bg-brand-yellow/60 text-accent-foreground"
                                    label="Por preparar"
                                    value={queue.new + queue.received}
                                    hint={`${queue.new} nuevos`}
                                />
                                <Tile
                                    icon={Flame}
                                    tone="bg-brand-orange/25 text-foreground"
                                    label="Preparando"
                                    value={queue.preparing}
                                />
                                <Tile
                                    icon={BellRing}
                                    tone="bg-brand-green/20 text-brand-green"
                                    label="Listos"
                                    value={queue.ready}
                                    hint="Esperan al mozo"
                                />
                            </>
                        )}
                        <Tile
                            icon={ChefHat}
                            tone="bg-brand-yellow/60 text-accent-foreground"
                            label="Cocina, promedio"
                            value={
                                stats.kitchen_minutes === null
                                    ? '—'
                                    : `${stats.kitchen_minutes} min`
                            }
                            hint="Del envío a listo"
                        />
                        {isMoney && (
                            <Tile
                                icon={HandCoins}
                                tone="bg-brand-green/20 text-brand-green"
                                label="Efectivo esperado"
                                value={
                                    stats.cash_expected_cents === null
                                        ? '—'
                                        : formatMoney(stats.cash_expected_cents)
                                }
                                hint="Inicio + efectivo"
                            />
                        )}
                        {can('cash.open') && (
                            <Tile
                                icon={Wallet}
                                tone="bg-primary/15 text-primary"
                                label="Caja"
                                value={stats.cash_open ? 'Abierta' : 'Cerrada'}
                                hint={
                                    <Link
                                        href={cash()}
                                        className="font-semibold text-primary underline-offset-4 hover:underline"
                                    >
                                        Ir a Caja
                                    </Link>
                                }
                            />
                        )}
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {stats.by_method !== null && (
                        <Card title="Ventas por método">
                            <ul className="flex flex-col gap-3">
                                {stats.by_method.map((item) => (
                                    <li
                                        key={item.method}
                                        className="flex flex-col gap-1"
                                    >
                                        <div className="flex justify-between text-sm">
                                            <span className="font-semibold">
                                                {item.label}
                                            </span>
                                            <span className="tabular-nums">
                                                {formatMoney(item.cents)}
                                            </span>
                                        </div>
                                        <div className="h-2 rounded-full bg-muted">
                                            <div
                                                className={cn(
                                                    'h-full rounded-full',
                                                    methodColor[item.method] ??
                                                        'bg-primary',
                                                )}
                                                style={{
                                                    width: `${(item.cents / methodTotal) * 100}%`,
                                                }}
                                            />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    )}

                    <Card title="Platos más vendidos">
                        {stats.top_products.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                Aún no hay pedidos hoy.
                            </p>
                        ) : (
                            <ol className="flex flex-col gap-3">
                                {stats.top_products.map((item, index) => (
                                    <li
                                        key={item.name}
                                        className="flex flex-col gap-1"
                                    >
                                        <div className="flex justify-between gap-2 text-sm">
                                            <span className="truncate font-semibold">
                                                {index + 1}. {item.name}
                                            </span>
                                            <span className="tabular-nums">
                                                {item.quantity}
                                            </span>
                                        </div>
                                        <div className="h-2 rounded-full bg-muted">
                                            <div
                                                className="h-full rounded-full bg-primary"
                                                style={{
                                                    width: `${(item.quantity / topMax) * 100}%`,
                                                }}
                                            />
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        )}
                    </Card>

                    <Card
                        title="Pedidos por tipo"
                        className="md:col-span-2 lg:col-span-1"
                    >
                        <ul className="grid grid-cols-3 gap-2 lg:grid-cols-1">
                            {stats.by_type.map((item) => (
                                <li
                                    key={item.type}
                                    className="flex flex-col gap-1 rounded-xl bg-muted/50 p-3 lg:flex-row lg:items-center lg:justify-between"
                                >
                                    <span className="text-sm font-semibold">
                                        {item.label}
                                    </span>
                                    <span className="display text-2xl">
                                        {item.count}
                                        <span className="ml-1 text-xs font-semibold text-muted-foreground">
                                            {Math.round(
                                                (item.count / typeTotal) * 100,
                                            )}
                                            %
                                        </span>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </Card>
                </div>

                {can('sales.create') && (
                    <Button
                        asChild
                        size="lg"
                        className="h-16 gap-3 rounded-2xl text-lg font-bold md:hidden"
                    >
                        <Link href={floor()}>
                            <Drumstick className="size-6" />
                            Nueva venta
                        </Link>
                    </Button>
                )}
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [{ title: 'Inicio', href: dashboard() }],
};
