import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { Category, Product, ProductVariant } from '@/types/menu';
import type { CartLine } from '@/types/orders';

function Tile({
    product,
    icon,
    quantityOf,
    onAdd,
}: {
    product: Product;
    icon: string | null;
    quantityOf: (variantId: number) => number;
    onAdd: (variant: ProductVariant) => void;
}) {
    const single = product.variants.length === 1;
    const soldOut = !product.is_available;
    const wide = product.variants.length >= 3;

    return (
        <div
            className={cn(
                'relative flex gap-3 rounded-2xl bg-card p-3 ring-1 ring-border',
                wide
                    ? 'flex-col sm:flex-row sm:items-center'
                    : 'flex-col justify-between',
                soldOut && 'opacity-50',
            )}
        >
            {single && quantityOf(product.variants[0].id) > 0 && (
                <span className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {quantityOf(product.variants[0].id)}
                </span>
            )}
            <div
                className={cn(
                    'flex items-center gap-2',
                    wide && 'sm:w-44 sm:shrink-0',
                )}
            >
                <span
                    aria-hidden="true"
                    className="bg-brand-gradient grid size-9 shrink-0 place-items-center rounded-xl text-lg"
                >
                    {icon ?? '🍽️'}
                </span>
                <p className="line-clamp-2 text-sm leading-tight font-bold">
                    {product.name}
                </p>
            </div>

            {single ? (
                <button
                    type="button"
                    disabled={soldOut}
                    onClick={() => onAdd(product.variants[0])}
                    className="flex items-center justify-between rounded-xl bg-primary/10 px-3 py-2 text-sm font-bold text-primary transition-transform duration-150 hover:bg-primary/15 active:scale-95 disabled:pointer-events-none"
                >
                    {soldOut ? 'Agotado' : 'Agregar'}
                    <span className="display text-base">
                        {formatMoney(product.variants[0].price_cents)}
                    </span>
                </button>
            ) : (
                <ul
                    className={cn(
                        'grid flex-1 gap-1.5',
                        wide
                            ? 'auto-cols-fr grid-flow-col'
                            : 'grid-cols-[repeat(auto-fit,minmax(5.25rem,1fr))]',
                    )}
                >
                    {product.variants.map((variant) => {
                        const picked = quantityOf(variant.id);

                        return (
                            <li key={variant.id} className="relative">
                                {picked > 0 && (
                                    <span className="absolute -top-2 -right-1.5 z-10 grid size-5 place-items-center rounded-full bg-foreground text-[11px] font-bold text-background">
                                        {picked}
                                    </span>
                                )}
                                <button
                                    type="button"
                                    disabled={soldOut}
                                    onClick={() => onAdd(variant)}
                                    className={cn(
                                        'flex w-full flex-col items-center rounded-xl px-2 py-1.5 transition-transform duration-150 active:scale-95 disabled:pointer-events-none',
                                        picked > 0
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-primary/10 text-primary hover:bg-primary/15',
                                    )}
                                >
                                    <span className="w-full truncate text-center text-xs font-bold">
                                        {variant.name}
                                    </span>
                                    <span className="display text-base leading-tight">
                                        {soldOut
                                            ? 'Agotado'
                                            : formatMoney(variant.price_cents)}
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}

export function MenuPane({
    categories,
    lines,
    onAdd,
}: {
    categories: Category[];
    lines: CartLine[];
    onAdd: (line: CartLine) => void;
}) {
    const [selected, setSelected] = useState<number | null>(null);
    const [search, setSearch] = useState('');

    const quantities = useMemo(() => {
        const map = new Map<number, number>();

        lines.forEach((line) => map.set(line.variantId, line.quantity));

        return map;
    }, [lines]);

    const term = search.trim().toLowerCase();
    const visible = categories
        .filter((category) => selected === null || category.id === selected)
        .map((category) => ({
            ...category,
            products: category.products.filter((product) =>
                term === '' ? true : product.name.toLowerCase().includes(term),
            ),
        }))
        .filter((category) => category.products.length > 0);

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
                <h2 className="display mr-2 text-xl">Carta</h2>
                <div className="relative min-w-48 flex-1">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Buscar plato"
                        aria-label="Buscar plato"
                        className="h-9 rounded-full pl-9"
                    />
                </div>
            </div>

            <div
                role="tablist"
                aria-label="Categorías"
                className="flex flex-wrap gap-1.5"
            >
                {[{ id: null, name: 'Todo', icon: null }, ...categories].map(
                    (category) => (
                        <button
                            key={category.id ?? 'all'}
                            type="button"
                            role="tab"
                            aria-selected={selected === category.id}
                            onClick={() => setSelected(category.id)}
                            className={cn(
                                'rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-border transition-colors duration-150',
                                selected === category.id
                                    ? 'bg-primary text-primary-foreground ring-transparent'
                                    : 'bg-card',
                            )}
                        >
                            {category.icon} {category.name}
                        </button>
                    ),
                )}
            </div>

            {visible.map((category) => (
                <section key={category.id} className="flex flex-col gap-2">
                    <h3 className="text-sm font-bold text-muted-foreground">
                        {category.icon} {category.name}
                    </h3>
                    <ul className="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-3">
                        {category.products.map((product) => (
                            <li
                                key={product.id}
                                className={
                                    product.variants.length >= 3
                                        ? 'col-span-full'
                                        : undefined
                                }
                            >
                                <Tile
                                    product={product}
                                    icon={category.icon}
                                    quantityOf={(variantId) =>
                                        quantities.get(variantId) ?? 0
                                    }
                                    onAdd={(variant) =>
                                        onAdd({
                                            variantId: variant.id,
                                            productName: product.name,
                                            variantName: variant.name,
                                            priceCents: variant.price_cents,
                                            quantity: 1,
                                            note: '',
                                        })
                                    }
                                />
                            </li>
                        ))}
                    </ul>
                </section>
            ))}

            {visible.length === 0 && (
                <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground ring-1 ring-border">
                    No hay platos con esa búsqueda.
                </p>
            )}
        </div>
    );
}
