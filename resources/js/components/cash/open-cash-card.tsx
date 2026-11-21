import { Wallet } from 'lucide-react';
import { useState } from 'react';
import { MoneyInput } from '@/components/cash/money-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useConfirmedAction } from '@/hooks/use-confirmed-action';
import { visit } from '@/lib/feedback';
import { formatMoney, toCents } from '@/lib/money';
import { destroy, store } from '@/routes/cash/sessions';

export function OpenCashCard({
    bare = false,
    onOpened,
}: {
    /** Sin tarjeta ni título: para usarlo dentro de un panel. */
    bare?: boolean;
    onOpened?: () => void;
}) {
    const run = useConfirmedAction();
    const [opening, setOpening] = useState('');

    const open = () =>
        run({
            confirm: {
                title: `¿Abrir la caja con ${formatMoney(toCents(opening))}?`,
                description: 'Es el efectivo con el que empieza el turno.',
                confirmLabel: 'Abrir caja',
            },
            messages: {
                loading: 'Abriendo caja…',
                success: 'Caja abierta',
                error: 'No se pudo abrir la caja',
            },
            run: () =>
                visit(store(), {
                    opening: (toCents(opening) / 100).toFixed(2),
                }).then((result) => {
                    onOpened?.();

                    return result;
                }),
            undoFor: (result) =>
                result.createdId === undefined
                    ? undefined
                    : () => visit(destroy(result.createdId as number)),
        });

    return (
        <section
            className={
                bare
                    ? 'flex flex-col gap-4'
                    : 'flex flex-col gap-4 rounded-3xl bg-card p-5 ring-1 ring-border'
            }
        >
            <div className={bare ? 'hidden' : 'flex items-center gap-3'}>
                <span className="grid size-12 place-items-center rounded-2xl bg-brand-yellow">
                    <Wallet className="size-6" />
                </span>
                <div>
                    <h2 className="display text-2xl">Caja cerrada</h2>
                    <p className="text-sm text-muted-foreground">
                        Ábrela para poder cobrar.
                    </p>
                </div>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="opening">Efectivo inicial</Label>
                <MoneyInput
                    id="opening"
                    label="Efectivo inicial en caja"
                    value={opening}
                    onChange={setOpening}
                />
            </div>
            <Button
                type="button"
                size="lg"
                className="h-14 rounded-2xl text-base font-bold"
                disabled={opening === ''}
                onClick={open}
            >
                Abrir caja
            </Button>
        </section>
    );
}
