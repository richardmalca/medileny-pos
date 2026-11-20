import { Head, Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { ProductVisual } from '@/components/menu/product-visual';
import { Button } from '@/components/ui/button';
import { useConfirmedAction } from '@/hooks/use-confirmed-action';
import { visit } from '@/lib/feedback';
import { priceLabel } from '@/lib/menu';
import { cn } from '@/lib/utils';
import { availability, create, edit, index } from '@/routes/menu';
import type { Category, Product } from '@/types/menu';

export default function MenuIndex({ categories }: { categories: Category[] }) {
    const run = useConfirmedAction();
    const [selected, setSelected] = useState<number | null>(null);

    const toggleAvailability = (product: Product) => {
        const next = !product.is_available;

        return run({
            confirm: {
                title: next
                    ? `¿Volver a ofrecer ${product.name}?`
                    : `¿Marcar ${product.name} como agotado?`,
                description: next
                    ? 'Los mozos y cajeros podrán venderlo otra vez.'
                    : 'No se podrá vender hasta que lo vuelvas a activar.',
                confirmLabel: next ? 'Marcar disponible' : 'Marcar agotado',
                destructive: !next,
            },
            messages: {
                loading: 'Actualizando disponibilidad…',
                success: next
                    ? `${product.name} está disponible`
                    : `${product.name} está agotado`,
                error: 'No se pudo actualizar la disponibilidad',
            },
            run: () => visit(availability(product.id), { is_available: next }),
            undo: () =>
                visit(availability(product.id), { is_available: !next }),
        });
    };
    const visible = categories.filter(
        (category) => selected === null || category.id === selected,
    );
    const total = categories.reduce(
        (sum, category) => sum + category.products.length,
        0,
    );

    return (
        <>
            <Head title="Carta" />

            <div className="flex w-full flex-col gap-6">
                <header className="flex items-end justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold text-muted-foreground">
                            {total} productos
                        </p>
                        <h1 className="display text-4xl md:text-4xl">Carta</h1>
                    </div>
                    <Button
                        asChild
                        size="lg"
                        className="h-12 gap-2 rounded-2xl font-bold"
                    >
                        <Link href={create()}>
                            <Plus className="size-5" />
                            Nuevo
                        </Link>
                    </Button>
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

                        <ul className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
                            {category.products.map((product) => (
                                <li
                                    key={product.id}
                                    className={cn(
                                        'flex items-center gap-3 rounded-3xl bg-card p-3 ring-1 ring-border',
                                        !product.is_available && 'opacity-70',
                                    )}
                                >
                                    <Link
                                        href={edit(product.id)}
                                        prefetch
                                        className="flex min-w-0 flex-1 items-center gap-3 transition-transform duration-150 active:scale-[0.98]"
                                    >
                                        <ProductVisual
                                            imageUrl={product.image_url}
                                            icon={category.icon}
                                            name={product.name}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-bold">
                                                {product.name}
                                            </p>
                                            <p className="line-clamp-1 text-sm text-muted-foreground">
                                                {product.description}
                                            </p>
                                            <p className="display text-xl text-primary">
                                                {priceLabel(product)}
                                            </p>
                                        </div>
                                    </Link>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={
                                            product.is_available
                                                ? 'outline'
                                                : 'destructive'
                                        }
                                        className="h-11 shrink-0 rounded-full px-4 font-bold"
                                        aria-pressed={!product.is_available}
                                        onClick={() =>
                                            toggleAvailability(product)
                                        }
                                    >
                                        {product.is_available
                                            ? 'Disponible'
                                            : 'Agotado'}
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    </section>
                ))}
            </div>
        </>
    );
}

MenuIndex.layout = {
    breadcrumbs: [{ title: 'Carta', href: index() }],
};
