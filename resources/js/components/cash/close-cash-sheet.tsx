import { useState } from 'react';
import { MoneyInput } from '@/components/cash/money-input';
import { ResponsiveSheetContent } from '@/components/responsive-sheet-content';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Sheet,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { formatMoney, toCents } from '@/lib/money';
import { cn } from '@/lib/utils';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    expectedCents: number;
    onConfirm: (countedCents: number) => void;
};

function Counter({
    expectedCents,
    onConfirm,
}: Pick<Props, 'expectedCents' | 'onConfirm'>) {
    const [counted, setCounted] = useState('');
    const difference = toCents(counted) - expectedCents;

    return (
        <>
            <SheetHeader className="text-left">
                <SheetTitle className="display text-3xl">
                    Cerrar caja
                </SheetTitle>
                <SheetDescription>
                    Cuenta el efectivo que hay en la caja e ingrésalo.
                </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-4 px-4">
                <div className="flex items-baseline justify-between rounded-2xl bg-card p-4 ring-1 ring-border">
                    <span className="font-semibold text-muted-foreground">
                        Efectivo esperado
                    </span>
                    <span className="display text-3xl">
                        {formatMoney(expectedCents)}
                    </span>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="counted">Efectivo contado</Label>
                    <MoneyInput
                        id="counted"
                        label="Efectivo contado"
                        value={counted}
                        onChange={setCounted}
                        autoFocus
                    />
                </div>
                {counted !== '' && (
                    <p
                        className={cn(
                            'rounded-2xl p-4 text-center font-bold',
                            difference === 0
                                ? 'bg-brand-green/20 text-brand-green'
                                : 'bg-destructive/15 text-destructive',
                        )}
                    >
                        {difference === 0
                            ? 'La caja cuadra'
                            : difference > 0
                              ? `Sobran ${formatMoney(difference)}`
                              : `Faltan ${formatMoney(-difference)}`}
                    </p>
                )}
            </div>

            <SheetFooter>
                <Button
                    type="button"
                    size="lg"
                    className="h-14 rounded-2xl text-base font-bold"
                    disabled={counted === ''}
                    onClick={() => onConfirm(toCents(counted))}
                >
                    Cerrar caja
                </Button>
            </SheetFooter>
        </>
    );
}

export function CloseCashSheet({ open, onOpenChange, ...rest }: Props) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <ResponsiveSheetContent>
                {open && <Counter {...rest} />}
            </ResponsiveSheetContent>
        </Sheet>
    );
}
