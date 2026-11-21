import {
    Banknote,
    CreditCard,
    HandCoins,
    Lock,
    RotateCcw,
    Smartphone,
    Wallet,
} from 'lucide-react';
import { useState } from 'react';
import { OpenCashSheet } from '@/components/cash/open-cash-sheet';
import { ElapsedBadge } from '@/components/floor/elapsed-badge';
import { Button } from '@/components/ui/button';
import { formatMoney } from '@/lib/money';
import { formatClock, formatDateTime } from '@/lib/time';
import { cn } from '@/lib/utils';
import type {
    CashSessionView,
    MethodOption,
    OpenCashSession,
    OrderToCollect,
    PaymentMethod,
    PaymentView,
} from '@/types/cash';
import type { Thresholds } from '@/types/floor';

type Props = {
    session: OpenCashSession | null;
    toCollect: OrderToCollect[];
    recentPayments: PaymentView[];
    history: CashSessionView[];
    methods: MethodOption[];
    now: number;
    thresholds: Thresholds;
    onCollect: (orderId: number) => void;
    onVoid: (payment: PaymentView) => void;
    onReopen: (entry: CashSessionView) => void;
    onClose: () => void;
};

const methodIcon: Record<PaymentMethod, typeof Banknote> = {
    cash: Banknote,
    yape: Smartphone,
    plin: Smartphone,
    card: CreditCard,
};

const methodTone: Record<PaymentMethod, string> = {
    cash: 'bg-brand-green/20 text-brand-green',
    yape: 'bg-brand-orange/25 text-foreground',
    plin: 'bg-brand-yellow text-on-pastel',
    card: 'bg-primary/15 text-primary',
};

const panel =
    'flex min-h-0 flex-col gap-2 rounded-2xl bg-muted/40 p-3 ring-1 ring-border';

function PanelTitle({ title, count }: { title: string; count?: number }) {
    return (
        <h2 className="flex shrink-0 items-center justify-between">
            <span className="display text-lg">{title}</span>
            {count !== undefined && (
                <span className="rounded-full bg-card px-2 py-0.5 text-xs font-bold">
                    {count}
                </span>
            )}
        </h2>
    );
}

/** Caja en PC: resumen arriba y tres paneles (por cobrar, cobros, cierres). */
export function CashDesktop({
    session,
    toCollect,
    recentPayments,
    history,
    methods,
    now,
    thresholds,
    onCollect,
    onVoid,
    onReopen,
    onClose,
}: Props) {
    const [opening, setOpening] = useState(false);
    const pending = toCollect.reduce(
        (sum, order) => sum + (order.total_cents - order.paid_cents),
        0,
    );

    return (
        <div className="flex h-[calc(100svh-5.75rem)] min-h-[32rem] w-full flex-col gap-3">
            <header className="flex shrink-0 items-end justify-between gap-4">
                <div>
                    <p className="text-sm font-semibold text-muted-foreground">
                        {session
                            ? `Abierta a las ${formatClock(session.opened_at)} por ${session.opened_by_name}`
                            : 'Turno'}
                    </p>
                    <h1 className="display text-2xl">Caja</h1>
                </div>
                {session ? (
                    session.can_close && (
                        <Button
                            type="button"
                            variant="outline"
                            className="h-10 gap-2 rounded-xl font-bold"
                            onClick={onClose}
                        >
                            <Lock className="size-4" />
                            Cerrar caja
                        </Button>
                    )
                ) : (
                    <Button
                        type="button"
                        className="h-10 gap-2 rounded-xl font-bold"
                        onClick={() => setOpening(true)}
                    >
                        <Wallet className="size-4" />
                        Abrir caja
                    </Button>
                )}
            </header>

            {session ? (
                <section
                    aria-label="Resumen de caja"
                    className="grid shrink-0 grid-cols-[1.4fr_repeat(4,1fr)] gap-3"
                >
                    <div className="bg-brand-gradient flex flex-col justify-center rounded-2xl p-4 text-on-gradient shadow-md">
                        <p className="text-xs font-semibold text-on-gradient">
                            Efectivo esperado
                        </p>
                        <p className="display text-4xl leading-tight">
                            {formatMoney(session.expected_cents)}
                        </p>
                        <p className="text-xs text-on-gradient">
                            Inicio {formatMoney(session.opening_cents)} · ventas
                            en efectivo {formatMoney(session.cash_sales_cents)}
                        </p>
                    </div>
                    {methods.map((method) => {
                        const Icon = methodIcon[method.value];

                        return (
                            <div
                                key={method.value}
                                className="flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-border"
                            >
                                <span
                                    className={cn(
                                        'grid size-10 shrink-0 place-items-center rounded-xl',
                                        methodTone[method.value],
                                    )}
                                >
                                    <Icon className="size-5" />
                                </span>
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-muted-foreground">
                                        {method.label}
                                    </p>
                                    <p className="display truncate text-xl">
                                        {formatMoney(
                                            session.totals[method.value],
                                        )}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </section>
            ) : (
                <section className="flex shrink-0 items-center gap-4 rounded-2xl bg-card p-4 ring-1 ring-border">
                    <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-yellow">
                        <Wallet className="size-6" />
                    </span>
                    <div>
                        <p className="display text-xl">Caja cerrada</p>
                        <p className="text-sm text-muted-foreground">
                            Ábrela para poder cobrar las cuentas pendientes.
                        </p>
                    </div>
                </section>
            )}

            <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1.1fr)_minmax(0,1.3fr)_minmax(0,0.9fr)] gap-3">
                <section aria-label="Por cobrar" className={panel}>
                    <PanelTitle title="Por cobrar" count={toCollect.length} />
                    {toCollect.length > 0 && (
                        <p className="shrink-0 text-xs text-muted-foreground">
                            Pendiente en total{' '}
                            <span className="font-bold text-foreground">
                                {formatMoney(pending)}
                            </span>
                        </p>
                    )}
                    <ul className="no-scrollbar flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
                        {toCollect.length === 0 && (
                            <li className="py-6 text-center text-sm text-muted-foreground">
                                No hay cuentas abiertas.
                            </li>
                        )}
                        {toCollect.map((order) => (
                            <li key={order.id}>
                                <button
                                    type="button"
                                    onClick={() => onCollect(order.id)}
                                    className="flex w-full items-center gap-3 rounded-xl bg-card p-3 text-left ring-1 ring-border transition-all duration-150 hover:ring-primary/60 active:scale-[0.99]"
                                >
                                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                                        <span className="truncate text-sm font-bold">
                                            {order.label}
                                        </span>
                                        <ElapsedBadge
                                            since={order.opened_at}
                                            now={now}
                                            thresholds={thresholds}
                                            prefix="Abierta"
                                        />
                                    </span>
                                    <span className="text-right">
                                        <span className="display block text-xl text-primary">
                                            {formatMoney(
                                                order.total_cents -
                                                    order.paid_cents,
                                            )}
                                        </span>
                                        {order.paid_cents > 0 && (
                                            <span className="text-[11px] text-muted-foreground">
                                                Pagado{' '}
                                                {formatMoney(order.paid_cents)}
                                            </span>
                                        )}
                                    </span>
                                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-green text-on-green">
                                        <HandCoins className="size-4" />
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </section>

                <section aria-label="Últimos cobros" className={panel}>
                    <PanelTitle
                        title="Últimos cobros"
                        count={recentPayments.length}
                    />
                    <ul className="no-scrollbar flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto">
                        {recentPayments.length === 0 && (
                            <li className="py-6 text-center text-sm text-muted-foreground">
                                Aún no hay cobros en este turno.
                            </li>
                        )}
                        {recentPayments.map((payment) => {
                            const Icon = methodIcon[payment.method];

                            return (
                                <li
                                    key={payment.id}
                                    className={cn(
                                        'flex items-center gap-2.5 rounded-xl bg-card px-3 py-2 ring-1 ring-border',
                                        payment.voided_at && 'opacity-70',
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'grid size-8 shrink-0 place-items-center rounded-lg',
                                            methodTone[payment.method],
                                        )}
                                    >
                                        <Icon className="size-4" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p
                                            className={cn(
                                                'truncate text-sm font-bold',
                                                payment.voided_at &&
                                                    'line-through',
                                            )}
                                        >
                                            {payment.order_label}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {payment.method_label} ·{' '}
                                            {formatClock(payment.created_at)}
                                            {payment.voided_at && ' · Anulado'}
                                        </p>
                                    </div>
                                    <span className="display text-lg">
                                        {formatMoney(payment.amount_cents)}
                                    </span>
                                    {payment.can_void && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 rounded-full px-2.5 text-xs font-bold text-destructive"
                                            onClick={() => onVoid(payment)}
                                        >
                                            Anular
                                        </Button>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </section>

                <section aria-label="Cierres anteriores" className={panel}>
                    <PanelTitle title="Cierres anteriores" />
                    <ul className="no-scrollbar flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto">
                        {history.length === 0 && (
                            <li className="py-6 text-center text-sm text-muted-foreground">
                                Todavía no hay cierres.
                            </li>
                        )}
                        {history.map((entry) => {
                            const difference = entry.difference_cents ?? 0;

                            return (
                                <li
                                    key={entry.id}
                                    className="flex items-center gap-2 rounded-xl bg-card px-3 py-2 ring-1 ring-border"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-bold">
                                            {entry.closed_at &&
                                                formatDateTime(entry.closed_at)}
                                        </p>
                                        <p className="truncate text-xs text-muted-foreground">
                                            {entry.opened_by_name} · contado{' '}
                                            {formatMoney(
                                                entry.counted_cents ?? 0,
                                            )}
                                        </p>
                                    </div>
                                    <span
                                        className={cn(
                                            'shrink-0 rounded-full px-2 py-0.5 text-xs font-bold',
                                            difference === 0
                                                ? 'bg-brand-green/20 text-brand-green'
                                                : 'bg-destructive/15 text-destructive',
                                        )}
                                    >
                                        {difference === 0
                                            ? 'Cuadra'
                                            : `${difference > 0 ? '+' : '−'}${formatMoney(Math.abs(difference))}`}
                                    </span>
                                    {entry.can_reopen && !session && (
                                        <button
                                            type="button"
                                            aria-label="Reabrir caja"
                                            title="Reabrir caja"
                                            onClick={() => onReopen(entry)}
                                            className="grid size-8 shrink-0 place-items-center rounded-full ring-1 ring-border hover:bg-muted"
                                        >
                                            <RotateCcw className="size-4" />
                                        </button>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </section>
            </div>

            <OpenCashSheet open={opening} onOpenChange={setOpening} />
        </div>
    );
}
