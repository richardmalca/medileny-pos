import { Head, Link } from '@inertiajs/react';
import {
    Armchair,
    DoorOpen,
    HandCoins,
    Plus,
    Receipt,
    RotateCcw,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { ElapsedBadge } from '@/components/floor/elapsed-badge';
import { ChangeTablesSheet } from '@/components/orders/change-tables-sheet';
import { RoundCard } from '@/components/orders/round-card';
import { Button } from '@/components/ui/button';
import { useOrderActions } from '@/hooks/use-order-actions';
import { useNow } from '@/hooks/use-now';
import { formatMoney } from '@/lib/money';
import { index } from '@/routes/floor';
import { checkout, receipt } from '@/routes/orders';
import { create as addRound } from '@/routes/orders/rounds';
import type { OrderDetail, TableOptionZone, Thresholds } from '@/types/floor';

type Props = {
    order: OrderDetail;
    can_add: boolean;
    table_options: TableOptionZone[];
    thresholds: Thresholds;
    server_now: string;
};

export default function OrdersShow({
    order,
    can_add: canAdd,
    table_options: tableOptions,
    thresholds,
    server_now: serverNow,
}: Props) {
    const now = useNow(serverNow);
    const [tablesOpen, setTablesOpen] = useState(false);
    const { changeRound, changeItem, serve, moveTables, changeAccount } =
        useOrderActions(order, tableOptions);

    const isCancelled = order.status === 'cancelled';

    const applyTables = (ids: number[]) => {
        setTablesOpen(false);

        return moveTables(ids);
    };

    return (
        <>
            <Head title={order.label} />

            <div className="flex w-full flex-col gap-6 pb-24">
                <header className="flex flex-col gap-2">
                    <p className="text-sm font-semibold text-muted-foreground">
                        {order.type_label} · Cuenta #{order.number}
                    </p>
                    <h1 className="display text-4xl md:text-3xl">
                        {order.label}
                    </h1>
                    {order.status === 'paid' ? (
                        <p className="w-fit rounded-full bg-brand-green/20 px-3 py-1 text-sm font-bold text-brand-green">
                            Cuenta pagada
                        </p>
                    ) : isCancelled ? (
                        <p className="w-fit rounded-full bg-destructive/15 px-3 py-1 text-sm font-bold text-destructive">
                            Cuenta cancelada
                        </p>
                    ) : (
                        <div className="flex flex-wrap items-center gap-2">
                            <ElapsedBadge
                                since={order.opened_at}
                                now={now}
                                thresholds={thresholds}
                                prefix="Abierta hace"
                            />
                            <ElapsedBadge
                                since={order.waiting_since}
                                now={now}
                                thresholds={thresholds}
                                prefix="Último pedido hace"
                            />
                        </div>
                    )}
                    {order.customer_name && (
                        <p className="text-sm text-muted-foreground">
                            {order.customer_name}
                            {order.customer_phone &&
                                ` · ${order.customer_phone}`}
                            {order.delivery_address &&
                                ` · ${order.delivery_address}`}
                        </p>
                    )}
                </header>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(20rem,1fr)] lg:items-start">
                    <ul className="flex flex-col gap-4">
                        {order.rounds.map((round) => (
                            <RoundCard
                                key={round.id}
                                round={round}
                                now={now}
                                onCancelRound={(value) =>
                                    changeRound(value, true)
                                }
                                onRestoreRound={(value) =>
                                    changeRound(value, false)
                                }
                                onServe={serve}
                                onCancelItem={(item) => changeItem(item, true)}
                                onRestoreItem={(item) =>
                                    changeItem(item, false)
                                }
                            />
                        ))}
                    </ul>

                    <div className="flex flex-col gap-6 lg:sticky lg:top-24">
                        <div className="flex items-baseline justify-between rounded-3xl bg-card p-5 ring-1 ring-border">
                            <span className="font-semibold text-muted-foreground">
                                Total
                            </span>
                            <span className="display text-4xl">
                                {formatMoney(order.total_cents)}
                            </span>
                        </div>

                        <p className="text-sm text-muted-foreground">
                            Los platos de cocina se pueden cambiar durante{' '}
                            {order.change_window_minutes} minutos. Las bebidas,
                            hasta entregarlas.
                        </p>

                        {order.can_charge && (
                            <Button
                                asChild
                                size="lg"
                                className="h-14 gap-2 rounded-2xl bg-brand-green text-base font-bold text-on-green hover:bg-brand-green/90"
                            >
                                <Link href={checkout(order.id)}>
                                    <HandCoins className="size-5" />
                                    Cobrar{' '}
                                    {formatMoney(
                                        order.total_cents - order.paid_cents,
                                    )}
                                </Link>
                            </Button>
                        )}

                        {order.can_receipt && (
                            <Button
                                asChild
                                size="lg"
                                variant="outline"
                                className="h-14 gap-2 rounded-2xl text-base font-bold"
                            >
                                <Link href={receipt(order.id)}>
                                    <Receipt className="size-5" />
                                    Ver comprobante
                                </Link>
                            </Button>
                        )}

                        {canAdd && (
                            <Button
                                asChild
                                size="lg"
                                className="h-14 gap-2 rounded-2xl text-base font-bold"
                            >
                                <Link href={addRound(order.id)}>
                                    <Plus className="size-5" />
                                    Agregar platos o bebidas
                                </Link>
                            </Button>
                        )}

                        <div className="flex flex-col gap-3">
                            {order.can_move_tables &&
                                order.type !== 'delivery' && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="lg"
                                        className="h-12 gap-2 rounded-xl font-bold"
                                        onClick={() => setTablesOpen(true)}
                                    >
                                        <Armchair className="size-5" />
                                        Cambiar o juntar mesas
                                    </Button>
                                )}
                            {order.can_move_tables &&
                                order.type === 'takeaway' &&
                                order.table_ids.length > 0 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="lg"
                                        className="h-12 gap-2 rounded-xl font-bold"
                                        onClick={() => applyTables([])}
                                    >
                                        <DoorOpen className="size-5" />
                                        Liberar mesa
                                    </Button>
                                )}
                            {order.can_cancel && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="lg"
                                    className="h-12 gap-2 rounded-xl font-bold text-destructive"
                                    onClick={() => changeAccount(true)}
                                >
                                    <Trash2 className="size-5" />
                                    Cancelar cuenta
                                </Button>
                            )}
                            {order.can_restore && (
                                <Button
                                    type="button"
                                    size="lg"
                                    className="h-12 gap-2 rounded-xl font-bold"
                                    onClick={() => changeAccount(false)}
                                >
                                    <RotateCcw className="size-5" />
                                    Restaurar cuenta
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ChangeTablesSheet
                open={tablesOpen}
                onOpenChange={setTablesOpen}
                zones={tableOptions}
                current={order.table_ids}
                requireOne={order.type === 'dine_in'}
                onConfirm={applyTables}
            />
        </>
    );
}

OrdersShow.layout = {
    breadcrumbs: [
        { title: 'Mesas', href: index() },
        { title: 'Cuenta', href: index() },
    ],
};
