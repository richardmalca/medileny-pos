import { Head, usePoll } from '@inertiajs/react';
import { Lock, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import {
    CheckoutDialog,
    useCheckoutDialog,
} from '@/components/cash/checkout-dialog';
import { CashDesktop } from '@/components/cash/cash-desktop';
import { CloseCashSheet } from '@/components/cash/close-cash-sheet';
import { OpenCashCard } from '@/components/cash/open-cash-card';
import { ElapsedBadge } from '@/components/floor/elapsed-badge';
import { Button } from '@/components/ui/button';
import { useConfirmedAction } from '@/hooks/use-confirmed-action';
import { useNow } from '@/hooks/use-now';
import { visit } from '@/lib/feedback';
import { formatMoney } from '@/lib/money';
import { formatClock, formatDateTime } from '@/lib/time';
import { cn } from '@/lib/utils';
import { index } from '@/routes/cash';
import { close, reopen } from '@/routes/cash/sessions';
import { voidMethod } from '@/routes/payments';
import type {
    CashSessionView,
    MethodOption,
    OpenCashSession,
    OrderToCollect,
    PaymentView,
    ReceiptOrder,
} from '@/types/cash';
import type { Thresholds } from '@/types/floor';

type Props = {
    session: OpenCashSession | null;
    to_collect: OrderToCollect[];
    recent_payments: PaymentView[];
    history: CashSessionView[];
    methods: MethodOption[];
    checkout: ReceiptOrder | null;
    thresholds: Thresholds;
    server_now: string;
};

export default function CashIndex({
    session,
    to_collect: toCollect,
    recent_payments: recentPayments,
    history,
    methods,
    checkout,
    thresholds,
    server_now: serverNow,
}: Props) {
    usePoll(30000, {
        only: [
            'session',
            'to_collect',
            'recent_payments',
            'checkout',
            'server_now',
        ],
    });

    const now = useNow(serverNow);
    const run = useConfirmedAction();
    const [closing, setClosing] = useState(false);
    const payment = useCheckoutDialog(
        (query) => index({ query: query ?? {} }).url,
    );

    const closeCash = (countedCents: number) => {
        if (!session) {
            return;
        }

        setClosing(false);

        const difference = countedCents - session.expected_cents;

        return run({
            confirm: {
                title: '¿Cerrar la caja?',
                description:
                    difference === 0
                        ? `Contaste ${formatMoney(countedCents)} y la caja cuadra.`
                        : `Contaste ${formatMoney(countedCents)}; se esperaban ${formatMoney(session.expected_cents)} (${difference > 0 ? 'sobran' : 'faltan'} ${formatMoney(Math.abs(difference))}).`,
                confirmLabel: 'Cerrar caja',
                destructive: difference !== 0,
            },
            messages: {
                loading: 'Cerrando caja…',
                success: 'Caja cerrada',
                error: 'No se pudo cerrar la caja',
            },
            run: () =>
                visit(close(session.id), {
                    counted: (countedCents / 100).toFixed(2),
                }),
            undo: () => visit(reopen(session.id)),
        });
    };

    const voidPayment = (payment: PaymentView) =>
        run({
            confirm: {
                title: `¿Anular el cobro de ${formatMoney(payment.amount_cents)}?`,
                description: `${payment.order_label ?? 'La cuenta'} se reabre y habrá que cobrarla de nuevo. Este cambio no se puede deshacer.`,
                confirmLabel: 'Anular cobro',
                destructive: true,
            },
            messages: {
                loading: 'Anulando cobro…',
                success: 'Cobro anulado',
                error: 'No se pudo anular el cobro',
            },
            run: () => visit(voidMethod(payment.id)),
        });

    const reopenLast = (last: CashSessionView) =>
        run({
            confirm: {
                title: '¿Reabrir la caja?',
                description: 'Volverá a quedar abierta con sus cobros.',
                confirmLabel: 'Reabrir',
            },
            messages: {
                loading: 'Reabriendo caja…',
                success: 'Caja reabierta',
                error: 'No se pudo reabrir la caja',
            },
            run: () => visit(reopen(last.id)),
        });

    return (
        <>
            <Head title="Caja" />

            <div className="hidden lg:block">
                <CashDesktop
                    session={session}
                    toCollect={toCollect}
                    recentPayments={recentPayments}
                    history={history}
                    methods={methods}
                    now={now}
                    thresholds={thresholds}
                    onCollect={payment.open}
                    onVoid={voidPayment}
                    onReopen={reopenLast}
                    onClose={() => setClosing(true)}
                />
            </div>

            <div className="flex w-full flex-col gap-6 pb-10 lg:hidden">
                <header>
                    <p className="text-sm font-semibold text-muted-foreground">
                        {session
                            ? `Abierta a las ${formatClock(session.opened_at)} por ${session.opened_by_name}`
                            : 'Turno'}
                    </p>
                    <h1 className="display text-4xl md:text-4xl">Caja</h1>
                </header>

                <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
                    <div className="flex flex-col gap-6">
                        {session ? (
                            <section className="bg-brand-gradient flex flex-col gap-4 rounded-3xl p-5 text-white shadow-lg">
                                <div>
                                    <p className="text-sm font-semibold text-white/85">
                                        Efectivo esperado
                                    </p>
                                    <p className="display text-5xl md:text-5xl">
                                        {formatMoney(session.expected_cents)}
                                    </p>
                                    <p className="text-sm text-white/85">
                                        Inicio{' '}
                                        {formatMoney(session.opening_cents)} ·
                                        Efectivo{' '}
                                        {formatMoney(session.cash_sales_cents)}
                                    </p>
                                </div>
                                <ul className="grid grid-cols-2 gap-2 md:grid-cols-4">
                                    {methods.map((method) => (
                                        <li
                                            key={method.value}
                                            className="rounded-2xl bg-white/15 p-3"
                                        >
                                            <p className="text-xs font-semibold text-white/85">
                                                {method.label}
                                            </p>
                                            <p className="display text-xl">
                                                {formatMoney(
                                                    session.totals[
                                                        method.value
                                                    ],
                                                )}
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                                {session.can_close && (
                                    <Button
                                        type="button"
                                        size="lg"
                                        className="h-12 gap-2 rounded-xl bg-white font-bold text-foreground hover:bg-white/90"
                                        onClick={() => setClosing(true)}
                                    >
                                        <Lock className="size-5" />
                                        Cerrar caja
                                    </Button>
                                )}
                            </section>
                        ) : (
                            <OpenCashCard />
                        )}

                        <section
                            aria-labelledby="to-collect"
                            className="flex flex-col gap-3"
                        >
                            <h2 id="to-collect" className="display text-2xl">
                                Por cobrar
                            </h2>
                            {toCollect.length === 0 ? (
                                <p className="rounded-3xl bg-card p-6 text-center text-muted-foreground ring-1 ring-border">
                                    No hay cuentas abiertas.
                                </p>
                            ) : (
                                <ul className="grid gap-3">
                                    {toCollect.map((order) => (
                                        <li key={order.id}>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    payment.open(order.id)
                                                }
                                                className="flex w-full items-center justify-between gap-3 rounded-3xl bg-card p-4 text-left ring-1 ring-border transition-transform duration-150 hover:ring-primary/50 active:scale-[0.98]"
                                            >
                                                <span className="flex min-w-0 flex-col gap-1">
                                                    <span className="truncate font-bold">
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
                                                    <span className="display block text-2xl text-primary">
                                                        {formatMoney(
                                                            order.total_cents -
                                                                order.paid_cents,
                                                        )}
                                                    </span>
                                                    {order.paid_cents > 0 && (
                                                        <span className="text-xs text-muted-foreground">
                                                            Pagado{' '}
                                                            {formatMoney(
                                                                order.paid_cents,
                                                            )}
                                                        </span>
                                                    )}
                                                </span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    </div>
                    <div className="flex flex-col gap-6">
                        {recentPayments.length > 0 && (
                            <section
                                aria-labelledby="payments"
                                className="flex flex-col gap-3"
                            >
                                <h2 id="payments" className="display text-2xl">
                                    Últimos cobros
                                </h2>
                                <ul className="flex flex-col gap-2">
                                    {recentPayments.map((payment) => (
                                        <li
                                            key={payment.id}
                                            className={cn(
                                                'flex items-center justify-between gap-3 rounded-2xl bg-card p-3 ring-1 ring-border',
                                                payment.voided_at &&
                                                    'opacity-50',
                                            )}
                                        >
                                            <div className="min-w-0">
                                                <p
                                                    className={cn(
                                                        'truncate font-bold',
                                                        payment.voided_at &&
                                                            'line-through',
                                                    )}
                                                >
                                                    {payment.order_label}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {payment.method_label} ·{' '}
                                                    {formatClock(
                                                        payment.created_at,
                                                    )}
                                                    {payment.voided_at &&
                                                        ' · Anulado'}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="display text-xl">
                                                    {formatMoney(
                                                        payment.amount_cents,
                                                    )}
                                                </span>
                                                {payment.can_void && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-11 rounded-full px-4 font-bold text-destructive"
                                                        onClick={() =>
                                                            voidPayment(payment)
                                                        }
                                                    >
                                                        Anular
                                                    </Button>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {history.length > 0 && (
                            <section
                                aria-labelledby="history"
                                className="flex flex-col gap-3"
                            >
                                <h2 id="history" className="display text-2xl">
                                    Cierres anteriores
                                </h2>
                                <ul className="flex flex-col gap-2">
                                    {history.map((entry) => (
                                        <li
                                            key={entry.id}
                                            className="flex items-center justify-between gap-3 rounded-2xl bg-card p-3 ring-1 ring-border"
                                        >
                                            <div>
                                                <p className="font-bold">
                                                    {entry.closed_at &&
                                                        formatDateTime(
                                                            entry.closed_at,
                                                        )}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {entry.opened_by_name} ·
                                                    contado{' '}
                                                    {formatMoney(
                                                        entry.counted_cents ??
                                                            0,
                                                    )}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={cn(
                                                        'rounded-full px-3 py-1 text-sm font-bold',
                                                        entry.difference_cents ===
                                                            0
                                                            ? 'bg-brand-green/20 text-brand-green'
                                                            : 'bg-destructive/15 text-destructive',
                                                    )}
                                                >
                                                    {entry.difference_cents ===
                                                    0
                                                        ? 'Cuadra'
                                                        : `${(entry.difference_cents ?? 0) > 0 ? '+' : '−'}${formatMoney(Math.abs(entry.difference_cents ?? 0))}`}
                                                </span>
                                                {entry.can_reopen &&
                                                    !session && (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="icon"
                                                            className="size-11 rounded-full"
                                                            aria-label="Reabrir caja"
                                                            onClick={() =>
                                                                reopenLast(
                                                                    entry,
                                                                )
                                                            }
                                                        >
                                                            <RotateCcw className="size-5" />
                                                        </Button>
                                                    )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}
                    </div>
                </div>
            </div>

            <CheckoutDialog
                payId={payment.payId}
                checkout={checkout}
                sessionOpen={session !== null}
                methods={methods}
                onClose={payment.close}
            />

            {session && (
                <CloseCashSheet
                    open={closing}
                    onOpenChange={setClosing}
                    expectedCents={session.expected_cents}
                    onConfirm={closeCash}
                />
            )}
        </>
    );
}

CashIndex.layout = {
    breadcrumbs: [{ title: 'Caja', href: index() }],
};
