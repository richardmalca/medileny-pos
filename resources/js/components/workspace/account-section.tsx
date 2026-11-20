import { Link } from '@inertiajs/react';
import {
    Armchair,
    DoorOpen,
    EllipsisVertical,
    HandCoins,
    Receipt,
    RotateCcw,
    Send,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { ElapsedBadge } from '@/components/floor/elapsed-badge';
import { ChangeTablesSheet } from '@/components/orders/change-tables-sheet';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CompactRound } from '@/components/workspace/compact-round';
import { useOrderActions } from '@/hooks/use-order-actions';
import { formatMoney } from '@/lib/money';
import { receipt } from '@/routes/orders';
import type {
    OrderDetail,
    OrderSummary,
    TableOptionZone,
    Thresholds,
} from '@/types/floor';

type Props = {
    summary: OrderSummary;
    detail: OrderDetail | null;
    tableOptions: TableOptionZone[];
    canCharge: boolean;
    onCharge: (orderId: number) => void;
    now: number;
    thresholds: Thresholds;
    /** Lista de platos por agregar (puede estar vacía). */
    cart: ReactNode;
    cartCount: number;
    cartTotal: number;
    canSend: boolean;
    onSend: () => void;
};

/**
 * Panel de una cuenta abierta con tres zonas:
 * cabecera fija (quién, total, estado), lista desplazable (tandas y platos por
 * agregar) y pie fijo con la acción principal (Cobrar, o Agregar si hay platos).
 */
export function AccountSection({ summary, detail, ...rest }: Props) {
    if (!detail) {
        return (
            <div className="bg-brand-gradient rounded-2xl p-3 text-white">
                <p className="display text-2xl leading-none">{summary.label}</p>
                <p className="mt-1 text-sm text-white/85">Cargando cuenta…</p>
            </div>
        );
    }

    return <Loaded order={detail} {...rest} />;
}

function Loaded({
    order,
    tableOptions,
    canCharge,
    onCharge,
    now,
    thresholds,
    cart,
    cartCount,
    cartTotal,
    canSend,
    onSend,
}: Omit<Props, 'summary' | 'detail'> & { order: OrderDetail }) {
    const [tablesOpen, setTablesOpen] = useState(false);
    const [showCancelled, setShowCancelled] = useState(false);
    const { changeRound, changeItem, serve, moveTables, changeAccount } =
        useOrderActions(order, tableOptions);

    const open = order.status === 'open';
    const due = order.total_cents - order.paid_cents;
    const mayCharge = order.can_charge && canCharge;
    const hasCart = cartCount > 0;
    const cancelledCount = order.rounds.reduce(
        (sum, round) =>
            sum +
            (round.cancelled_at
                ? round.items.length
                : round.items.filter((item) => item.cancelled_at).length),
        0,
    );
    const visibleRounds = order.rounds.filter(
        (round) => showCancelled || !round.cancelled_at,
    );

    const applyTables = (ids: number[]) => {
        setTablesOpen(false);

        return moveTables(ids);
    };

    const canChangeTables = order.can_move_tables && order.type !== 'delivery';
    const canRelease =
        order.can_move_tables &&
        order.type === 'takeaway' &&
        order.table_ids.length > 0;
    const hasMenu =
        canChangeTables || canRelease || order.can_cancel || order.can_restore;

    return (
        <>
            {/* Cabecera fija */}
            <div className="bg-brand-gradient flex shrink-0 flex-col gap-1.5 rounded-2xl p-2.5 text-white shadow-sm">
                <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold text-white/85">
                            {order.type_label} · Cuenta #{order.number}
                        </p>
                        <p className="display truncate text-xl leading-tight">
                            {order.label}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="display text-2xl leading-none">
                            {formatMoney(order.total_cents)}
                        </p>
                        {order.paid_cents > 0 && (
                            <p className="mt-0.5 text-[11px] text-white/85">
                                Pagado {formatMoney(order.paid_cents)}
                            </p>
                        )}
                    </div>
                    {hasMenu && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    aria-label="Más acciones de la cuenta"
                                    className="grid size-8 shrink-0 place-items-center rounded-full bg-black/20 transition-colors duration-150 hover:bg-black/30"
                                >
                                    <EllipsisVertical className="size-4" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                                {canChangeTables && (
                                    <DropdownMenuItem
                                        onSelect={() => setTablesOpen(true)}
                                    >
                                        <Armchair className="size-4" />
                                        Cambiar o juntar mesas
                                    </DropdownMenuItem>
                                )}
                                {canRelease && (
                                    <DropdownMenuItem
                                        onSelect={() => applyTables([])}
                                    >
                                        <DoorOpen className="size-4" />
                                        Liberar mesa
                                    </DropdownMenuItem>
                                )}
                                {order.can_restore && (
                                    <DropdownMenuItem
                                        onSelect={() => changeAccount(false)}
                                    >
                                        <RotateCcw className="size-4" />
                                        Restaurar cuenta
                                    </DropdownMenuItem>
                                )}
                                {order.can_cancel && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            variant="destructive"
                                            onSelect={() => changeAccount(true)}
                                        >
                                            <Trash2 className="size-4" />
                                            Cancelar cuenta
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                    {open ? (
                        <>
                            <span className="rounded-full bg-white">
                                <ElapsedBadge
                                    since={order.opened_at}
                                    now={now}
                                    thresholds={thresholds}
                                    prefix="Abierta"
                                />
                            </span>
                        </>
                    ) : (
                        <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-foreground">
                            {order.status === 'paid'
                                ? 'Cuenta pagada'
                                : 'Cuenta cancelada'}
                        </span>
                    )}
                </div>

                {order.customer_name && (
                    <p className="truncate text-xs text-white/90">
                        {[
                            order.customer_name,
                            order.customer_phone,
                            order.delivery_address,
                        ]
                            .filter(Boolean)
                            .join(' · ')}
                    </p>
                )}
            </div>

            {/* Zona desplazable */}
            <div className="no-scrollbar -mx-1 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-1 py-0.5">
                <ul className="flex flex-col gap-2">
                    {visibleRounds.map((round) => (
                        <CompactRound
                            key={round.id}
                            round={round}
                            showCancelled={showCancelled}
                            onCancelRound={(value) => changeRound(value, true)}
                            onRestoreRound={(value) =>
                                changeRound(value, false)
                            }
                            onServe={serve}
                            onCancelItem={(item) => changeItem(item, true)}
                            onRestoreItem={(item) => changeItem(item, false)}
                        />
                    ))}
                </ul>

                {cancelledCount > 0 && (
                    <button
                        type="button"
                        onClick={() => setShowCancelled((value) => !value)}
                        className="self-center rounded-full px-3 py-1 text-xs font-semibold text-muted-foreground underline-offset-4 hover:underline"
                    >
                        {showCancelled
                            ? 'Ocultar anulados'
                            : `Ver anulados (${cancelledCount})`}
                    </button>
                )}

                {cart}
            </div>

            {/* Pie fijo: la acción principal siempre a la vista */}
            <div className="flex shrink-0 flex-col gap-2 border-t pt-2.5">
                {hasCart ? (
                    <>
                        <div className="flex items-baseline justify-between">
                            <span className="text-sm font-semibold text-muted-foreground">
                                Por agregar · {cartCount}
                            </span>
                            <span className="display text-2xl">
                                {formatMoney(cartTotal)}
                            </span>
                        </div>
                        <Button
                            type="button"
                            size="lg"
                            className="h-12 gap-2 rounded-xl text-base font-bold"
                            disabled={!canSend}
                            onClick={onSend}
                        >
                            <Send className="size-5" />
                            Agregar a la cuenta
                        </Button>
                        {mayCharge && (
                            <Button
                                type="button"
                                variant="outline"
                                className="h-10 gap-2 rounded-xl font-bold"
                                onClick={() => onCharge(order.id)}
                            >
                                <HandCoins className="size-4" />
                                Cobrar lo anterior {formatMoney(due)}
                            </Button>
                        )}
                    </>
                ) : (
                    <>
                        {mayCharge && (
                            <Button
                                type="button"
                                size="lg"
                                className="h-12 gap-2 rounded-xl bg-brand-green text-base font-bold text-white hover:bg-brand-green/90"
                                onClick={() => onCharge(order.id)}
                            >
                                <HandCoins className="size-5" />
                                Cobrar {formatMoney(due)}
                            </Button>
                        )}
                        {order.can_receipt && (
                            <Button
                                asChild
                                variant="outline"
                                className="h-11 gap-2 rounded-xl font-bold"
                            >
                                <Link href={receipt(order.id)}>
                                    <Receipt className="size-4" />
                                    Ver comprobante
                                </Link>
                            </Button>
                        )}
                        {!mayCharge && !order.can_receipt && (
                            <p className="text-center text-xs text-muted-foreground">
                                Toca la carta para agregar más a la cuenta.
                            </p>
                        )}
                    </>
                )}
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
