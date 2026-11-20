import { Head, Link } from '@inertiajs/react';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatMoney } from '@/lib/money';
import { formatDateTime } from '@/lib/time';
import { index as floor } from '@/routes/floor';
import { index as cashIndex } from '@/routes/cash';
import type { ReceiptOrder } from '@/types/cash';

export default function OrdersReceipt({ order }: { order: ReceiptOrder }) {
    const payments = order.payments.filter((payment) => !payment.voided_at);
    const change = payments.reduce(
        (sum, payment) => sum + payment.change_cents,
        0,
    );

    return (
        <>
            <Head title={`Comprobante ${order.label}`} />

            <div className="mx-auto flex w-full max-w-md flex-col gap-6 pb-24 print:max-w-none print:pb-0">
                <article className="flex flex-col gap-4 rounded-3xl bg-card p-6 ring-1 ring-border print:rounded-none print:p-0 print:ring-0">
                    <header className="flex flex-col items-center gap-1 text-center">
                        <p className="display text-3xl">Pollería Medileny</p>
                        <p className="text-sm font-semibold">
                            {order.branch.name}
                        </p>
                        {order.branch.address && (
                            <p className="text-sm text-muted-foreground">
                                {order.branch.address}
                            </p>
                        )}
                        {order.branch.phone && (
                            <p className="text-sm text-muted-foreground">
                                Tel. {order.branch.phone}
                            </p>
                        )}
                    </header>

                    <div className="border-y border-dashed py-3 text-sm">
                        <p className="font-bold">
                            Nota de venta #{order.number}
                        </p>
                        <p>{order.label}</p>
                        {order.paid_at && (
                            <p className="text-muted-foreground">
                                {formatDateTime(order.paid_at)}
                            </p>
                        )}
                    </div>

                    <ul className="flex flex-col gap-2">
                        {order.lines.map((line) => (
                            <li
                                key={line.id}
                                className="flex justify-between gap-3"
                            >
                                <span>
                                    {line.quantity} × {line.name}
                                    <span className="block text-xs text-muted-foreground">
                                        {line.variant} ·{' '}
                                        {formatMoney(line.unit_price_cents)}
                                    </span>
                                </span>
                                <span className="tabular-nums">
                                    {formatMoney(line.total_cents)}
                                </span>
                            </li>
                        ))}
                    </ul>

                    <div className="flex items-baseline justify-between border-t border-dashed pt-3">
                        <span className="font-bold">TOTAL</span>
                        <span className="display text-3xl">
                            {formatMoney(order.total_cents)}
                        </span>
                    </div>

                    <ul className="flex flex-col gap-1 text-sm">
                        {payments.map((payment) => (
                            <li
                                key={payment.id}
                                className="flex justify-between"
                            >
                                <span>{payment.method_label}</span>
                                <span className="tabular-nums">
                                    {formatMoney(payment.tendered_cents)}
                                </span>
                            </li>
                        ))}
                        {change > 0 && (
                            <li className="flex justify-between font-bold">
                                <span>Vuelto</span>
                                <span className="tabular-nums">
                                    {formatMoney(change)}
                                </span>
                            </li>
                        )}
                    </ul>

                    <p className="text-center text-sm text-muted-foreground">
                        ¡Gracias por su preferencia!
                    </p>
                </article>

                <div className="flex flex-col gap-3 print:hidden">
                    <Button
                        type="button"
                        size="lg"
                        className="h-14 gap-2 rounded-2xl text-base font-bold"
                        onClick={() => window.print()}
                    >
                        <Printer className="size-5" />
                        Imprimir
                    </Button>
                    <Button
                        asChild
                        variant="outline"
                        size="lg"
                        className="h-12 rounded-xl"
                    >
                        <Link href={floor()}>Volver a Mesas</Link>
                    </Button>
                    <Button asChild variant="ghost" className="h-12 rounded-xl">
                        <Link href={cashIndex()}>Ir a Caja</Link>
                    </Button>
                </div>
            </div>
        </>
    );
}

OrdersReceipt.layout = {
    breadcrumbs: [{ title: 'Comprobante', href: floor() }],
};
