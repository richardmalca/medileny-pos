import { Head } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { ProductVisual } from '@/components/menu/product-visual';
import { CartBar } from '@/components/orders/cart-bar';
import { CartSheet } from '@/components/orders/cart-sheet';
import { ProductSheet } from '@/components/orders/product-sheet';
import { useCart } from '@/hooks/use-cart';
import { useConfirmedAction } from '@/hooks/use-confirmed-action';
import { visit } from '@/lib/feedback';
import { priceLabel } from '@/lib/menu';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import { uuid } from '@/lib/uuid';
import { create, store } from '@/routes/orders';
import { store as appendRound } from '@/routes/orders/rounds';
import { cancel } from '@/routes/rounds';
import type { ContextTable, OrderSummary } from '@/types/floor';
import type { Category, Product } from '@/types/menu';
import type { OrderDetails } from '@/types/orders';

const emptyDetails: OrderDetails = {
    type: 'takeaway',
    name: '',
    phone: '',
    address: '',
};

const typeLabels = {
    dine_in: 'Mesa',
    takeaway: 'Para llevar',
    delivery: 'Delivery',
};

type Props = {
    categories: Category[];
    tables: ContextTable[];
    order: OrderSummary | null;
};

export default function OrdersCreate({ categories, tables, order }: Props) {
    const run = useConfirmedAction();
    const cart = useCart();
    const clientId = useRef(uuid());
    const [selected, setSelected] = useState<number | null>(null);
    const [picking, setPicking] = useState<Product | null>(null);
    const [cartOpen, setCartOpen] = useState(false);
    const [details, setDetails] = useState<OrderDetails>({
        ...emptyDetails,
        type: tables.length > 0 ? 'dine_in' : 'takeaway',
    });

    const tableNames = tables.map((table) => table.name);
    const visible = categories.filter(
        (category) => selected === null || category.id === selected,
    );

    const send = () => {
        const where =
            order?.label ??
            (tableNames.length > 0
                ? tableNames.join(' + ')
                : typeLabels[details.type]);
        const items = cart.lines.map((line) => ({
            variant_id: line.variantId,
            quantity: line.quantity,
            note: line.note,
        }));
        return run({
            confirm: {
                title: order
                    ? `¿Agregar a ${where}?`
                    : '¿Enviar el pedido a cocina?',
                description: order
                    ? 'Se enviará a cocina como una nueva tanda de la cuenta.'
                    : where,
                confirmLabel: order ? 'Agregar y enviar' : 'Enviar a cocina',
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
                success: order
                    ? `Agregado a ${where}`
                    : `Pedido enviado a cocina (${where})`,
                error: 'No se pudo enviar el pedido',
            },
            run: () =>
                visit(
                    order ? appendRound(order.id) : store(),
                    order
                        ? { client_id: clientId.current, items }
                        : {
                              client_id: clientId.current,
                              type: details.type,
                              table_ids: tables.map((table) => table.id),
                              customer_name: details.name,
                              customer_phone: details.phone,
                              delivery_address: details.address,
                              items,
                          },
                ).then((result) => {
                    cart.clear();
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
        <>
            <Head title="Vender" />

            <div className="flex w-full flex-col gap-6 pb-24">
                <header>
                    <p className="text-sm font-semibold text-muted-foreground">
                        {order
                            ? `Agregando a ${order.label}`
                            : tableNames.length > 0
                              ? tableNames.join(' + ')
                              : 'Para llevar o delivery'}
                    </p>
                    <h1 className="display text-4xl md:text-4xl">Vender</h1>
                </header>

                <div
                    role="tablist"
                    aria-label="Categorías"
                    className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0"
                >
                    {[
                        { id: null, name: 'Todo', icon: null },
                        ...categories,
                    ].map((category) => (
                        <button
                            key={category.id ?? 'all'}
                            type="button"
                            role="tab"
                            aria-selected={selected === category.id}
                            onClick={() => setSelected(category.id)}
                            className={cn(
                                'min-h-11 shrink-0 rounded-full px-4 text-sm font-bold ring-1 ring-border transition-colors duration-150 active:scale-95',
                                selected === category.id
                                    ? 'bg-primary text-primary-foreground ring-transparent'
                                    : 'bg-card',
                            )}
                        >
                            {category.icon} {category.name}
                        </button>
                    ))}
                </div>

                {visible.map((category) => (
                    <section
                        key={category.id}
                        aria-labelledby={`category-${category.id}`}
                        className="flex flex-col gap-3"
                    >
                        <h2
                            id={`category-${category.id}`}
                            className="display text-2xl"
                        >
                            {category.icon} {category.name}
                        </h2>

                        <ul className="grid gap-3 md:grid-cols-2">
                            {category.products.map((product) => (
                                <li key={product.id}>
                                    <button
                                        type="button"
                                        disabled={!product.is_available}
                                        onClick={() => setPicking(product)}
                                        className={cn(
                                            'flex w-full items-center gap-3 rounded-3xl bg-card p-3 text-left ring-1 ring-border transition-transform duration-150 active:scale-[0.98]',
                                            !product.is_available &&
                                                'opacity-70',
                                        )}
                                    >
                                        <ProductVisual
                                            imageUrl={product.image_url}
                                            icon={category.icon}
                                            name={product.name}
                                        />
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate font-bold">
                                                {product.name}
                                            </span>
                                            <span className="line-clamp-1 block text-sm text-muted-foreground">
                                                {product.description}
                                            </span>
                                            <span className="display block text-xl text-primary">
                                                {product.is_available
                                                    ? priceLabel(product)
                                                    : 'Agotado'}
                                            </span>
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </section>
                ))}
            </div>

            <ProductSheet
                product={picking}
                onClose={() => setPicking(null)}
                onAdd={(lines) => lines.forEach(cart.add)}
            />

            <CartBar
                count={cart.count}
                total={cart.total}
                onOpen={() => setCartOpen(true)}
            />

            <CartSheet
                open={cartOpen}
                onOpenChange={setCartOpen}
                lines={cart.lines}
                total={cart.total}
                details={details}
                appendTo={order?.label ?? null}
                tableNames={tableNames}
                onDetailsChange={setDetails}
                onQuantity={cart.setQuantity}
                onNote={cart.setNote}
                onSend={send}
            />
        </>
    );
}

OrdersCreate.layout = {
    breadcrumbs: [{ title: 'Vender', href: create() }],
};
