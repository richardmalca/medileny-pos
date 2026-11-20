import { router } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import {
    availableTypes,
    isOrderDetailsValid,
} from '@/components/orders/order-details';
import {
    CheckoutDialog,
    useCheckoutDialog,
} from '@/components/cash/checkout-dialog';
import { MenuPane } from '@/components/workspace/menu-pane';
import { OrderPane } from '@/components/workspace/order-pane';
import type { Customer } from '@/components/workspace/order-pane';
import { SalonPane } from '@/components/workspace/salon-pane';
import { useCan } from '@/hooks/use-can';
import { useCart } from '@/hooks/use-cart';
import { usePersistedState } from '@/hooks/use-persisted-state';
import { useConfirmedAction } from '@/hooks/use-confirmed-action';
import { visit } from '@/lib/feedback';
import { formatMoney } from '@/lib/money';
import { uuid } from '@/lib/uuid';
import { index as floorIndex } from '@/routes/floor';
import { store } from '@/routes/orders';
import { store as appendRound } from '@/routes/orders/rounds';
import { cancel } from '@/routes/rounds';
import type {
    FloorTable,
    OrderDetail,
    OrderSummary,
    TableOptionZone,
    Thresholds,
    Zone,
} from '@/types/floor';
import type { MethodOption, ReceiptOrder } from '@/types/cash';
import type { Category } from '@/types/menu';
import type { OrderType } from '@/types/orders';

const typeLabels: Record<OrderType, string> = {
    dine_in: 'Mesa',
    takeaway: 'Para llevar',
    delivery: 'Delivery',
};

const emptyCustomer: Customer = { name: '', phone: '', address: '' };

const pane =
    'min-h-0 min-w-0 overflow-x-hidden overflow-y-auto rounded-3xl bg-muted/40 p-3 pb-6 ring-1 ring-border no-scrollbar';

export function PosWorkspace({
    zones,
    looseOrders,
    categories,
    detail,
    tableOptions,
    checkout,
    cashOpen,
    methods,
    now,
    thresholds,
}: {
    zones: Zone[];
    looseOrders: OrderSummary[];
    categories: Category[];
    detail: OrderDetail | null;
    tableOptions: TableOptionZone[];
    checkout: ReceiptOrder | null;
    cashOpen: boolean;
    methods: MethodOption[];
    now: number;
    thresholds: Thresholds;
}) {
    const run = useConfirmedAction();
    const can = useCan();
    const clientId = useRef(uuid());
    const [selected, setSelected] = usePersistedState<number[]>(
        'workspace:tables',
        [],
    );
    const [orderId, setOrderId] = usePersistedState<number | null>(
        'workspace:order',
        detail?.id ?? null,
    );
    const tables = zones.flatMap((zone) => zone.tables);
    const account =
        tables.find((table) => table.order?.id === orderId)?.order ??
        looseOrders.find((order) => order.id === orderId) ??
        null;
    const cart = useCart(
        'workspace:drafts',
        account ? `order:${account.id}` : 'new',
    );
    const payment = useCheckoutDialog(
        (query) =>
            floorIndex({
                query: {
                    ...(orderId !== null ? { order: orderId } : {}),
                    ...query,
                },
            }).url,
    );
    const [chosenType, setChosenType] = usePersistedState<OrderType | null>(
        'workspace:type',
        null,
    );
    const [customer, setCustomer] = usePersistedState<Customer>(
        'workspace:customer',
        emptyCustomer,
    );

    const chosen = tables.filter(
        (table) => !table.order && selected.includes(table.id),
    );
    const types = availableTypes(chosen.length > 0);
    const type =
        chosenType && types.includes(chosenType) ? chosenType : types[0];

    const loadDetail = (id: number) =>
        router.get(
            floorIndex({ query: { order: id } }).url,
            {},
            {
                only: ['detail', 'can_add', 'table_options'],
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );

    // Tras recargar, vuelve a abrir la cuenta que estabas viendo.
    useEffect(() => {
        if (orderId !== null && detail?.id !== orderId) {
            loadDetail(orderId);
        }
        // solo al montar
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const selectLoose = (order: OrderSummary) => {
        setOrderId(order.id);
        setSelected([]);
        loadDetail(order.id);
    };

    const select = (table: FloorTable) => {
        if (table.order) {
            setOrderId(table.order.id);
            setSelected([]);
            loadDetail(table.order.id);

            return;
        }

        const zoneOf = (id: number) =>
            zones.find((zone) => zone.tables.some((item) => item.id === id));
        const locked = chosen.length > 0 ? zoneOf(chosen[0].id) : undefined;

        if (locked && zoneOf(table.id)?.id !== locked.id) {
            toast.error(
                `Solo puedes juntar mesas de la misma zona (${locked.name}).`,
            );

            return;
        }

        setOrderId(null);
        setSelected((current) =>
            current.includes(table.id)
                ? current.filter((id) => id !== table.id)
                : [...current, table.id],
        );
    };

    const canSend =
        cart.lines.length > 0 &&
        (account !== null || isOrderDetailsValid({ type, ...customer }));

    const send = () => {
        const where =
            account?.label ??
            (chosen.length > 0
                ? chosen.map((table) => table.name).join(' + ')
                : typeLabels[type]);
        const items = cart.lines.map((line) => ({
            variant_id: line.variantId,
            quantity: line.quantity,
            note: line.note,
        }));

        return run({
            confirm: {
                title: account
                    ? `¿Agregar a ${where}?`
                    : '¿Enviar el pedido a cocina?',
                description: account
                    ? 'Se enviará a cocina como una nueva tanda de la cuenta.'
                    : where,
                confirmLabel: account ? 'Agregar y enviar' : 'Enviar a cocina',
                lines: cart.lines.map((line) => ({
                    text: `${line.quantity}× ${line.productName}`,
                    detail:
                        line.note === ''
                            ? line.variantName
                            : `${line.variantName} · ${line.note}`,
                    amount: formatMoney(line.priceCents * line.quantity),
                })),
                summary: { label: 'Total', value: formatMoney(cart.total) },
            },
            messages: {
                loading: 'Enviando pedido…',
                success: account
                    ? `Agregado a ${where}`
                    : `Pedido enviado a cocina (${where})`,
                error: 'No se pudo enviar el pedido',
            },
            run: () =>
                visit(
                    account ? appendRound(account.id) : store(),
                    account
                        ? {
                              client_id: clientId.current,
                              redirect: 'floor',
                              items,
                          }
                        : {
                              client_id: clientId.current,
                              type,
                              table_ids: chosen.map((table) => table.id),
                              customer_name: customer.name,
                              customer_phone: customer.phone,
                              delivery_address: customer.address,
                              items,
                          },
                    { preserveState: true },
                ).then((result) => {
                    cart.clear();
                    setSelected([]);
                    if (!account) {
                        setOrderId(null);
                    }
                    setChosenType(null);
                    setCustomer(emptyCustomer);
                    clientId.current = uuid();

                    return result;
                }),
            undoFor: (result) =>
                result.createdId === undefined
                    ? undefined
                    : () => visit(cancel(result.createdId as number)),
        });
    };

    return (
        <div className="grid h-[calc(100svh-5.75rem)] min-h-[34rem] grid-cols-[clamp(17rem,21%,28rem)_minmax(0,1fr)_clamp(21rem,26%,30rem)] gap-4">
            <section aria-label="Salón" className={pane}>
                <SalonPane
                    zones={zones}
                    looseOrders={looseOrders}
                    onSelectLoose={selectLoose}
                    selected={chosen.map((table) => table.id)}
                    activeOrderId={account?.id ?? null}
                    lockedZoneId={
                        chosen.length > 0
                            ? (zones.find((zone) =>
                                  zone.tables.some(
                                      (item) => item.id === chosen[0].id,
                                  ),
                              )?.id ?? null)
                            : null
                    }
                    onSelect={select}
                    now={now}
                    thresholds={thresholds}
                />
            </section>

            <section aria-label="Carta" className={pane}>
                <MenuPane
                    categories={categories}
                    lines={cart.lines}
                    onAdd={cart.add}
                />
            </section>

            <section
                aria-label="Pedido"
                className="flex min-h-0 min-w-0 flex-col overflow-x-hidden rounded-3xl bg-card p-3 ring-1 ring-border"
            >
                <OrderPane
                    account={account}
                    detail={detail?.id === account?.id ? detail : null}
                    tableOptions={tableOptions}
                    tables={chosen}
                    type={type}
                    types={types}
                    onType={setChosenType}
                    onRemoveTable={(id) =>
                        setSelected((current) =>
                            current.filter((value) => value !== id),
                        )
                    }
                    customer={customer}
                    onCustomer={(patch) =>
                        setCustomer((current) => ({ ...current, ...patch }))
                    }
                    lines={cart.lines}
                    total={cart.total}
                    count={cart.count}
                    onQuantity={cart.setQuantity}
                    onNote={cart.setNote}
                    onClear={cart.clear}
                    canSend={canSend}
                    onSend={send}
                    canCharge={can('sales.charge')}
                    onCharge={payment.open}
                    now={now}
                    thresholds={thresholds}
                />
            </section>

            <CheckoutDialog
                payId={payment.payId}
                checkout={checkout}
                sessionOpen={cashOpen}
                methods={methods}
                onClose={payment.close}
            />
        </div>
    );
}
