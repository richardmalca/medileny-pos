import { Send } from 'lucide-react';
import {
    isOrderDetailsValid,
    OrderDetailsFields,
} from '@/components/orders/order-details';
import { QuantityStepper } from '@/components/orders/quantity-stepper';
import { ResponsiveSheetContent } from '@/components/responsive-sheet-content';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Sheet,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { formatMoney } from '@/lib/money';
import type { CartLine, OrderDetails } from '@/types/orders';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    lines: CartLine[];
    total: number;
    details: OrderDetails;
    appendTo: string | null;
    tableNames: string[];
    onDetailsChange: (details: OrderDetails) => void;
    onQuantity: (variantId: number, quantity: number) => void;
    onNote: (variantId: number, note: string) => void;
    onSend: () => void;
};

export function CartSheet({
    open,
    onOpenChange,
    lines,
    total,
    details,
    appendTo,
    tableNames,
    onDetailsChange,
    onQuantity,
    onNote,
    onSend,
}: Props) {
    const canSend = lines.length > 0 && isOrderDetailsValid(details);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <ResponsiveSheetContent>
                <SheetHeader className="text-left">
                    <SheetTitle className="display text-3xl">Pedido</SheetTitle>
                    <SheetDescription>
                        Revisa los platos antes de enviar.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex flex-col gap-5 px-4">
                    {appendTo ? (
                        <p className="rounded-2xl bg-card p-3 font-semibold ring-1 ring-border">
                            Agregando a {appendTo}
                        </p>
                    ) : (
                        <>
                            {tableNames.length > 0 && (
                                <p className="rounded-2xl bg-card p-3 font-semibold ring-1 ring-border">
                                    {tableNames.join(' + ')}
                                </p>
                            )}
                            <OrderDetailsFields
                                details={details}
                                hasTables={tableNames.length > 0}
                                onChange={onDetailsChange}
                            />
                        </>
                    )}

                    <ul className="flex flex-col gap-3">
                        {lines.map((line) => (
                            <li
                                key={line.variantId}
                                className="flex flex-col gap-3 rounded-2xl bg-card p-3 ring-1 ring-border"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate font-bold">
                                            {line.productName}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {line.variantName} ·{' '}
                                            {formatMoney(line.priceCents)}
                                        </p>
                                    </div>
                                    <QuantityStepper
                                        label={`${line.productName} ${line.variantName}`}
                                        value={line.quantity}
                                        onChange={(next) =>
                                            onQuantity(line.variantId, next)
                                        }
                                    />
                                </div>
                                <Input
                                    value={line.note}
                                    onChange={(event) =>
                                        onNote(
                                            line.variantId,
                                            event.target.value,
                                        )
                                    }
                                    maxLength={120}
                                    aria-label={`Nota para ${line.productName}`}
                                    placeholder="Nota (ej. sin ensalada)"
                                    className="h-11 rounded-xl"
                                />
                            </li>
                        ))}
                    </ul>
                </div>

                <SheetFooter className="gap-3">
                    <div className="flex items-baseline justify-between">
                        <span className="font-semibold text-muted-foreground">
                            Total
                        </span>
                        <span className="display text-4xl">
                            {formatMoney(total)}
                        </span>
                    </div>
                    <Button
                        type="button"
                        size="lg"
                        className="h-14 gap-2 rounded-2xl text-base font-bold"
                        disabled={!canSend}
                        onClick={onSend}
                    >
                        <Send className="size-5" />
                        Enviar a cocina
                    </Button>
                </SheetFooter>
            </ResponsiveSheetContent>
        </Sheet>
    );
}
