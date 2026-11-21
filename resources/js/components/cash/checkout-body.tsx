import { Link } from '@inertiajs/react';
import { Banknote, CreditCard, Smartphone } from 'lucide-react';
import { useRef, useState } from 'react';
import { MoneyInput } from '@/components/cash/money-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useConfirmedAction } from '@/hooks/use-confirmed-action';
import { visit } from '@/lib/feedback';
import { formatMoney, toCents, toDecimal } from '@/lib/money';
import { formatClock } from '@/lib/time';
import { cn } from '@/lib/utils';
import { index as cashIndex } from '@/routes/cash';
import { show } from '@/routes/orders';
import { store } from '@/routes/orders/payments';
import { voidMethod } from '@/routes/payments';
import { uuid } from '@/lib/uuid';
import type {
    MethodOption,
    PaymentMethod,
    PaymentView,
    ReceiptOrder,
} from '@/types/cash';

const icons: Record<PaymentMethod, typeof Banknote> = {
    cash: Banknote,
    yape: Smartphone,
    plin: Smartphone,
    card: CreditCard,
};

const quickAmounts = [10, 20, 50, 100, 200];

type Props = {
    order: ReceiptOrder;
    sessionOpen: boolean;
    methods: MethodOption[];
    /** En el diálogo: no navega (se queda donde está) y avisa al cerrar. */
    inline?: boolean;
    onPaidFully?: () => void;
};

/** Formulario de cobro: se usa en la página y en el diálogo de Caja y Mesas. */
export function CheckoutBody({
    order,
    sessionOpen,
    methods,
    inline = false,
    onPaidFully,
}: Props) {
    const run = useConfirmedAction();
    const clientId = useRef(uuid());
    const [method, setMethod] = useState<PaymentMethod>('cash');
    const [amount, setAmount] = useState(toDecimal(order.remaining_cents));
    const [tendered, setTendered] = useState('');
    const [reference, setReference] = useState('');

    const amountCents = toCents(amount);
    const tenderedCents = tendered === '' ? amountCents : toCents(tendered);
    const change =
        method === 'cash' ? Math.max(0, tenderedCents - amountCents) : 0;
    const label = methods.find((item) => item.value === method)?.label ?? '';
    const valid =
        sessionOpen &&
        amountCents > 0 &&
        amountCents <= order.remaining_cents &&
        (method !== 'cash' || tenderedCents >= amountCents);

    const charge = () =>
        run({
            confirm: {
                title: `¿Cobrar ${formatMoney(amountCents)}?`,
                description:
                    amountCents === order.remaining_cents
                        ? 'Con este cobro la cuenta queda pagada y se liberan las mesas.'
                        : `Quedarán ${formatMoney(order.remaining_cents - amountCents)} por cobrar.`,
                lines: [
                    { text: order.label, detail: `Cuenta #${order.number}` },
                    { text: 'Medio de pago', amount: label },
                    ...(method === 'cash'
                        ? [
                              {
                                  text: 'Recibido',
                                  amount: formatMoney(tenderedCents),
                              },
                              {
                                  text: 'Vuelto',
                                  amount: formatMoney(change),
                              },
                          ]
                        : []),
                ],
                summary: { label: 'A cobrar', value: formatMoney(amountCents) },
                confirmLabel: 'Cobrar',
            },
            messages: {
                loading: 'Registrando cobro…',
                success: `Cobrado ${formatMoney(amountCents)} en ${label.toLowerCase()}`,
                error: 'No se pudo registrar el cobro',
            },
            run: () =>
                visit(store(order.id), {
                    client_id: clientId.current,
                    inline,
                    method,
                    amount: toDecimal(amountCents),
                    tendered:
                        method === 'cash' ? toDecimal(tenderedCents) : null,
                    reference:
                        reference.trim() === '' ? null : reference.trim(),
                }).then((result) => {
                    if (inline && amountCents >= order.remaining_cents) {
                        onPaidFully?.();
                    }

                    clientId.current = uuid();
                    setAmount(
                        toDecimal(
                            Math.max(order.remaining_cents - amountCents, 0),
                        ),
                    );
                    setTendered('');
                    setReference('');

                    return result;
                }),
            undoFor: (result) =>
                result.createdId === undefined
                    ? undefined
                    : () => visit(voidMethod(result.createdId as number)),
        });

    const voidPayment = (payment: PaymentView) =>
        run({
            confirm: {
                title: `¿Anular el cobro de ${formatMoney(payment.amount_cents)}?`,
                description:
                    'La cuenta se reabre. Este cambio no se puede deshacer.',
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

    return (
        <>
            {!sessionOpen && (
                <div className="flex flex-col gap-3 rounded-3xl bg-destructive/10 p-5 text-destructive">
                    <p className="font-bold">La caja está cerrada.</p>
                    <Button
                        asChild
                        variant="destructive"
                        className="h-12 rounded-xl"
                    >
                        <Link href={cashIndex()}>Ir a Caja para abrirla</Link>
                    </Button>
                </div>
            )}

            <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start">
                <div className="flex flex-col gap-3">
                    <section className="bg-brand-gradient flex flex-col gap-1 rounded-2xl p-4 text-on-gradient shadow-md">
                        <p className="text-xs font-semibold text-on-gradient">
                            {order.paid_cents > 0 ? 'Falta cobrar' : 'A cobrar'}
                        </p>
                        <p className="display text-5xl leading-none">
                            {formatMoney(order.remaining_cents)}
                        </p>
                        {order.paid_cents > 0 && (
                            <p className="text-xs text-on-gradient">
                                Total {formatMoney(order.total_cents)} · pagado{' '}
                                {formatMoney(order.paid_cents)}
                            </p>
                        )}
                    </section>

                    <section className="flex flex-col gap-1 rounded-2xl bg-card p-3 ring-1 ring-border">
                        <h3 className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                            Detalle · {order.lines.length}{' '}
                            {order.lines.length === 1 ? 'plato' : 'platos'}
                        </h3>
                        <ul className="no-scrollbar flex max-h-52 flex-col divide-y divide-border/60 overflow-y-auto">
                            {order.lines.map((line) => (
                                <li
                                    key={line.id}
                                    className="flex justify-between gap-3 py-1.5 text-sm"
                                >
                                    <span className="min-w-0">
                                        <span className="font-semibold">
                                            {line.quantity}× {line.name}
                                        </span>
                                        <span className="block text-xs text-muted-foreground">
                                            {line.variant}
                                        </span>
                                    </span>
                                    <span className="tabular-nums">
                                        {formatMoney(line.total_cents)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </section>

                    {order.payments.length > 0 && (
                        <ul className="flex flex-col gap-2">
                            {order.payments.map((payment) => (
                                <li
                                    key={payment.id}
                                    className={cn(
                                        'flex items-center justify-between gap-3 rounded-2xl bg-card p-3 ring-1 ring-border',
                                        payment.voided_at &&
                                            'line-through opacity-70',
                                    )}
                                >
                                    <span>
                                        <span className="font-bold">
                                            {payment.method_label}
                                        </span>
                                        <span className="text-sm text-muted-foreground">
                                            {' '}
                                            · {formatClock(payment.created_at)}
                                        </span>
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <span className="display text-xl">
                                            {formatMoney(payment.amount_cents)}
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
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <section className="flex flex-col gap-3 lg:sticky lg:top-24">
                    <div
                        role="radiogroup"
                        aria-label="Medio de pago"
                        className="grid grid-cols-2 gap-2 md:grid-cols-4"
                    >
                        {methods.map((item) => {
                            const Icon = icons[item.value];

                            return (
                                <button
                                    key={item.value}
                                    type="button"
                                    role="radio"
                                    aria-checked={method === item.value}
                                    onClick={() => setMethod(item.value)}
                                    className={cn(
                                        'flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl text-sm font-bold ring-1 ring-border transition-all duration-150 active:scale-95',
                                        method === item.value
                                            ? 'bg-primary/10 text-primary ring-2 ring-primary'
                                            : 'bg-card hover:bg-muted',
                                    )}
                                >
                                    <Icon className="size-6" />
                                    {item.label}
                                </button>
                            );
                        })}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="amount">Monto a cobrar</Label>
                        <MoneyInput
                            id="amount"
                            label="Monto a cobrar"
                            value={amount}
                            onChange={setAmount}
                        />
                        {order.remaining_cents > 1 && (
                            <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-xs text-muted-foreground">
                                    ¿Pago repartido?
                                </span>
                                <button
                                    type="button"
                                    className="rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-border hover:bg-muted"
                                    onClick={() =>
                                        setAmount(
                                            toDecimal(order.remaining_cents),
                                        )
                                    }
                                >
                                    Todo
                                </button>
                                <button
                                    type="button"
                                    className="rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-border hover:bg-muted"
                                    onClick={() =>
                                        setAmount(
                                            toDecimal(
                                                Math.round(
                                                    order.remaining_cents / 2,
                                                ),
                                            ),
                                        )
                                    }
                                >
                                    Mitad
                                </button>
                                <span className="text-xs text-muted-foreground">
                                    Cobra una parte aquí y el resto con otro
                                    medio.
                                </span>
                            </div>
                        )}
                    </div>

                    {method === 'cash' ? (
                        <div className="grid gap-2">
                            <Label htmlFor="tendered">Recibido</Label>
                            <MoneyInput
                                id="tendered"
                                label="Efectivo recibido"
                                value={tendered}
                                onChange={setTendered}
                            />
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-11 rounded-full px-4 font-bold"
                                    onClick={() =>
                                        setTendered(toDecimal(amountCents))
                                    }
                                >
                                    Exacto
                                </Button>
                                {quickAmounts.map((value) => (
                                    <Button
                                        key={value}
                                        type="button"
                                        variant="outline"
                                        className="h-11 rounded-full px-4 font-bold"
                                        title="Suma este billete a lo recibido"
                                        onClick={() =>
                                            setTendered(
                                                toDecimal(
                                                    (tendered === ''
                                                        ? 0
                                                        : toCents(tendered)) +
                                                        value * 100,
                                                ),
                                            )
                                        }
                                    >
                                        + S/ {value}
                                    </Button>
                                ))}
                                {tendered !== '' && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="h-11 rounded-full px-3 font-semibold text-muted-foreground"
                                        onClick={() => setTendered('')}
                                    >
                                        Limpiar
                                    </Button>
                                )}
                            </div>
                            <div
                                className={cn(
                                    'flex items-baseline justify-between rounded-2xl px-4 py-3',
                                    tendered === ''
                                        ? 'bg-muted/60 text-muted-foreground'
                                        : tenderedCents < amountCents
                                          ? 'bg-destructive/10 text-destructive'
                                          : 'bg-brand-green/15 text-brand-green',
                                )}
                            >
                                <span className="text-sm font-bold">
                                    {tendered === ''
                                        ? 'Toca los billetes que te dan (se suman) o Exacto'
                                        : tenderedCents < amountCents
                                          ? 'Falta'
                                          : change > 0
                                            ? 'Vuelto'
                                            : 'Pago exacto'}
                                </span>
                                {tendered !== '' && (
                                    <span className="display text-3xl">
                                        {tenderedCents < amountCents
                                            ? formatMoney(
                                                  amountCents - tenderedCents,
                                              )
                                            : formatMoney(change)}
                                    </span>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-2">
                            <Label htmlFor="reference">
                                Número de operación (opcional)
                            </Label>
                            <Input
                                id="reference"
                                value={reference}
                                onChange={(event) =>
                                    setReference(event.target.value)
                                }
                                maxLength={40}
                                className="h-12 rounded-xl"
                            />
                        </div>
                    )}

                    <Button
                        type="button"
                        size="lg"
                        className="h-14 rounded-2xl bg-brand-green text-lg font-bold text-on-green hover:bg-brand-green/90"
                        disabled={!valid}
                        onClick={charge}
                    >
                        Cobrar {formatMoney(amountCents)}
                    </Button>
                    {!inline && (
                        <Button
                            asChild
                            variant="outline"
                            className="h-12 rounded-xl"
                        >
                            <Link href={show(order.id)}>
                                Volver a la cuenta
                            </Link>
                        </Button>
                    )}
                </section>
            </div>
        </>
    );
}
