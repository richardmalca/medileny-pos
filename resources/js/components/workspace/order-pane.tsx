import { MessageSquarePlus, Send, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { QuantityStepper } from '@/components/orders/quantity-stepper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import { AccountSection } from '@/components/workspace/account-section';
import type {
    FloorTable,
    OrderDetail,
    OrderSummary,
    TableOptionZone,
    Thresholds,
} from '@/types/floor';
import type { CartLine, OrderType } from '@/types/orders';

export type Customer = { name: string; phone: string; address: string };

const typeLabels: Record<OrderType, string> = {
    dine_in: 'Mesa',
    takeaway: 'Para llevar',
    delivery: 'Delivery',
};

type Props = {
    account: OrderSummary | null;
    detail: OrderDetail | null;
    tableOptions: TableOptionZone[];
    tables: FloorTable[];
    type: OrderType;
    types: OrderType[];
    onType: (type: OrderType) => void;
    onRemoveTable: (id: number) => void;
    customer: Customer;
    onCustomer: (patch: Partial<Customer>) => void;
    lines: CartLine[];
    total: number;
    count: number;
    onQuantity: (variantId: number, quantity: number) => void;
    onNote: (variantId: number, note: string) => void;
    onClear: () => void;
    canSend: boolean;
    onSend: () => void;
    canCharge: boolean;
    onCharge: (orderId: number) => void;
    now: number;
    thresholds: Thresholds;
};

/** Línea del pedido en una sola fila; la nota se abre solo si hace falta. */
function CartLineRow({
    line,
    onQuantity,
    onNote,
}: {
    line: CartLine;
    onQuantity: (variantId: number, quantity: number) => void;
    onNote: (variantId: number, note: string) => void;
}) {
    const [editing, setEditing] = useState(false);
    const showInput = editing || line.note !== '';

    return (
        <li className="flex flex-col gap-1 rounded-xl bg-card px-2.5 py-2 ring-1 ring-border">
            <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm leading-tight font-bold">
                        {line.productName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                        {line.variantName} · {formatMoney(line.priceCents)}
                    </p>
                </div>
                {!showInput && (
                    <button
                        type="button"
                        onClick={() => setEditing(true)}
                        aria-label={`Agregar nota a ${line.productName}`}
                        className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted"
                    >
                        <MessageSquarePlus className="size-4" />
                    </button>
                )}
                <QuantityStepper
                    compact
                    label={`${line.productName} ${line.variantName}`}
                    value={line.quantity}
                    onChange={(next) => onQuantity(line.variantId, next)}
                />
            </div>
            {showInput && (
                <Input
                    value={line.note}
                    onChange={(event) =>
                        onNote(line.variantId, event.target.value)
                    }
                    placeholder="Nota (ej. sin ensalada)"
                    aria-label={`Nota para ${line.productName}`}
                    maxLength={120}
                    autoFocus={editing && line.note === ''}
                    className="h-8 rounded-lg text-xs"
                />
            )}
        </li>
    );
}

function CartList({
    lines,
    count,
    onClear,
    onQuantity,
    onNote,
    hint,
}: {
    lines: CartLine[];
    count: number;
    onClear: () => void;
    onQuantity: (variantId: number, quantity: number) => void;
    onNote: (variantId: number, note: string) => void;
    hint?: boolean;
}) {
    return (
        <>
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-muted-foreground">
                    {hint ? 'Por agregar' : 'Platos'} · {count}
                </h3>
                {lines.length > 0 && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 rounded-full px-2 text-xs text-destructive"
                        onClick={onClear}
                    >
                        <Trash2 className="size-3.5" />
                        Vaciar
                    </Button>
                )}
            </div>

            <ul className="flex flex-col gap-2">
                {lines.length === 0 && (
                    <li className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground ring-1 ring-border">
                        Toca un plato de la carta para agregarlo.
                    </li>
                )}
                {lines.map((line) => (
                    <CartLineRow
                        key={line.variantId}
                        line={line}
                        onQuantity={onQuantity}
                        onNote={onNote}
                    />
                ))}
            </ul>
        </>
    );
}

export function OrderPane({
    account,
    detail,
    tableOptions,
    tables,
    type,
    types,
    onType,
    onRemoveTable,
    customer,
    onCustomer,
    lines,
    total,
    count,
    onQuantity,
    onNote,
    onClear,
    canSend,
    onSend,
    canCharge,
    onCharge,
    now,
    thresholds,
}: Props) {
    if (account) {
        return (
            <div className="flex h-full min-h-0 flex-col gap-2">
                <AccountSection
                    summary={account}
                    detail={detail}
                    tableOptions={tableOptions}
                    canCharge={canCharge}
                    onCharge={onCharge}
                    now={now}
                    thresholds={thresholds}
                    cart={
                        lines.length > 0 ? (
                            <CartList
                                hint
                                lines={lines}
                                count={count}
                                onClear={onClear}
                                onQuantity={onQuantity}
                                onNote={onNote}
                            />
                        ) : null
                    }
                    cartCount={count}
                    cartTotal={total}
                    canSend={canSend}
                    onSend={onSend}
                />
            </div>
        );
    }

    return (
        <div className="flex h-full min-h-0 flex-col gap-3">
            {
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <h2 className="display text-xl">Pedido</h2>
                        {tables.length === 0 && (
                            <span className="text-xs font-semibold text-muted-foreground">
                                Sin mesa: elige una a la izquierda
                            </span>
                        )}
                    </div>
                    {tables.length > 0 && (
                        <ul className="flex flex-wrap gap-1.5">
                            {tables.map((table) => (
                                <li key={table.id}>
                                    <button
                                        type="button"
                                        onClick={() => onRemoveTable(table.id)}
                                        aria-label={`Quitar ${table.name}`}
                                        className="flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground"
                                    >
                                        {table.name}
                                        <X className="size-3" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                    <div
                        role="radiogroup"
                        aria-label="Tipo de pedido"
                        className="grid grid-cols-2 gap-1.5"
                    >
                        {types.map((option) => (
                            <button
                                key={option}
                                type="button"
                                role="radio"
                                aria-checked={type === option}
                                onClick={() => onType(option)}
                                className={cn(
                                    'rounded-xl py-2 text-sm font-bold ring-1 ring-border transition-colors duration-150',
                                    type === option
                                        ? 'bg-primary text-primary-foreground ring-transparent'
                                        : 'bg-card',
                                )}
                            >
                                {typeLabels[option]}
                            </button>
                        ))}
                    </div>
                    {type === 'takeaway' && tables.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                            El cliente espera sentado: la mesa queda ocupada
                            hasta entregar.
                        </p>
                    )}
                    {type === 'delivery' && (
                        <div className="grid gap-1.5">
                            <Input
                                value={customer.name}
                                onChange={(event) =>
                                    onCustomer({ name: event.target.value })
                                }
                                placeholder="Nombre del cliente"
                                aria-label="Nombre del cliente"
                                maxLength={80}
                                className="h-9 rounded-lg"
                            />
                            <Input
                                value={customer.phone}
                                onChange={(event) =>
                                    onCustomer({ phone: event.target.value })
                                }
                                placeholder="Teléfono"
                                aria-label="Teléfono"
                                inputMode="tel"
                                maxLength={20}
                                className="h-9 rounded-lg"
                            />
                            <Input
                                value={customer.address}
                                onChange={(event) =>
                                    onCustomer({ address: event.target.value })
                                }
                                placeholder="Dirección"
                                aria-label="Dirección"
                                maxLength={255}
                                className="h-9 rounded-lg"
                            />
                        </div>
                    )}
                </div>
            }

            <div className="no-scrollbar -mx-1 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-1 py-0.5">
                <CartList
                    lines={lines}
                    count={count}
                    onClear={onClear}
                    onQuantity={onQuantity}
                    onNote={onNote}
                />
            </div>

            <div className="flex flex-col gap-2 border-t pt-3">
                <div className="flex items-baseline justify-between">
                    <span className="text-sm font-semibold text-muted-foreground">
                        Total del pedido
                    </span>
                    <span className="display text-2xl">
                        {formatMoney(total)}
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
                    Enviar a cocina
                </Button>
            </div>
        </div>
    );
}
