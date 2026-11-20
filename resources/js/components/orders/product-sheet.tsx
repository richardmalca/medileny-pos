import { useState } from 'react';
import { QuantityStepper } from '@/components/orders/quantity-stepper';
import { ResponsiveSheetContent } from '@/components/responsive-sheet-content';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { formatMoney } from '@/lib/money';
import type { Product } from '@/types/menu';
import type { CartLine } from '@/types/orders';

type Props = {
    product: Product | null;
    onClose: () => void;
    onAdd: (lines: CartLine[]) => void;
};

function Picker({
    product,
    onClose,
    onAdd,
}: {
    product: Product;
    onClose: () => void;
    onAdd: (lines: CartLine[]) => void;
}) {
    // Con una sola presentación ya viene en 1: basta tocar "Agregar al pedido".
    const [quantities, setQuantities] = useState<Record<number, number>>(() =>
        product.variants.length === 1 ? { [product.variants[0].id]: 1 } : {},
    );

    const chosen = product.variants.filter(
        (variant) => (quantities[variant.id] ?? 0) > 0,
    );

    const submit = () => {
        onAdd(
            chosen.map((variant) => ({
                variantId: variant.id,
                productName: product.name,
                variantName: variant.name,
                priceCents: variant.price_cents,
                quantity: quantities[variant.id],
                note: '',
            })),
        );
        onClose();
    };

    return (
        <>
            <SheetHeader className="text-left">
                <SheetTitle className="display text-3xl">
                    {product.name}
                </SheetTitle>
                <SheetDescription>{product.description}</SheetDescription>
            </SheetHeader>

            <ul className="flex flex-col gap-3 px-4">
                {product.variants.map((variant) => (
                    <li
                        key={variant.id}
                        className="flex items-center justify-between gap-3 rounded-2xl bg-card p-3 ring-1 ring-border"
                    >
                        <div>
                            <p className="font-bold">{variant.name}</p>
                            <p className="display text-xl text-primary">
                                {formatMoney(variant.price_cents)}
                            </p>
                        </div>
                        <QuantityStepper
                            label={variant.name}
                            value={quantities[variant.id] ?? 0}
                            onChange={(next) =>
                                setQuantities((current) => ({
                                    ...current,
                                    [variant.id]: Math.max(0, next),
                                }))
                            }
                        />
                    </li>
                ))}
            </ul>

            <SheetFooter>
                <Button
                    type="button"
                    size="lg"
                    className="h-14 rounded-2xl text-base font-bold"
                    disabled={chosen.length === 0}
                    onClick={submit}
                >
                    Agregar al pedido
                </Button>
            </SheetFooter>
        </>
    );
}

export function ProductSheet({ product, onClose, onAdd }: Props) {
    return (
        <Sheet
            open={product !== null}
            onOpenChange={(open) => !open && onClose()}
        >
            <ResponsiveSheetContent>
                {product && (
                    <Picker
                        key={product.id}
                        product={product}
                        onClose={onClose}
                        onAdd={onAdd}
                    />
                )}
            </ResponsiveSheetContent>
        </Sheet>
    );
}
