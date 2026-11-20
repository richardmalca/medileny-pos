import { Check, Users } from 'lucide-react';
import { useState } from 'react';
import { ResponsiveSheetContent } from '@/components/responsive-sheet-content';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { TableOptionZone } from '@/types/floor';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    zones: TableOptionZone[];
    current: number[];
    requireOne: boolean;
    onConfirm: (ids: number[]) => void;
};

function Picker({
    zones,
    current,
    requireOne,
    onConfirm,
}: Omit<Props, 'open' | 'onOpenChange'>) {
    const [selected, setSelected] = useState<number[]>(current);

    const toggle = (id: number) =>
        setSelected((value) =>
            value.includes(id)
                ? value.filter((item) => item !== id)
                : [...value, id],
        );

    const zoneOf = new Map(
        zones.flatMap((zone) =>
            zone.tables.map((table) => [table.id, zone.id] as const),
        ),
    );
    // Solo se juntan mesas de una misma zona.
    const lockedZone = selected.length > 0 ? zoneOf.get(selected[0]) : null;

    const unchanged =
        selected.length === current.length &&
        selected.every((id) => current.includes(id));
    const invalid = requireOne && selected.length === 0;

    return (
        <>
            <SheetHeader className="text-left">
                <SheetTitle className="display text-3xl">Mesas</SheetTitle>
                <SheetDescription>
                    Elige las mesas de esta cuenta. Puedes juntar varias de la
                    misma zona o pasar a otra.
                </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-4 px-4">
                {zones.map((zone) => (
                    <section key={zone.id} className="flex flex-col gap-2">
                        <h3 className="font-bold">{zone.name}</h3>
                        <ul className="grid grid-cols-3 gap-2">
                            {zone.tables.map((table) => {
                                const active = selected.includes(table.id);
                                const otherZone =
                                    lockedZone !== null &&
                                    lockedZone !== undefined &&
                                    zone.id !== lockedZone;
                                const blocked = !table.selectable || otherZone;

                                return (
                                    <li key={table.id}>
                                        <button
                                            type="button"
                                            disabled={blocked}
                                            aria-pressed={active}
                                            onClick={() => toggle(table.id)}
                                            className={cn(
                                                'relative flex min-h-16 w-full flex-col items-start justify-between rounded-2xl p-2 text-left text-sm ring-1 ring-border transition-transform duration-150 active:scale-95',
                                                active
                                                    ? 'bg-primary text-primary-foreground ring-transparent'
                                                    : 'bg-card',
                                                blocked && 'opacity-40',
                                            )}
                                        >
                                            <span className="font-bold">
                                                {table.name}
                                            </span>
                                            <span className="flex items-center gap-1 text-xs">
                                                <Users className="size-3.5" />
                                                {table.capacity}
                                                {!table.selectable
                                                    ? ' · Ocupada'
                                                    : otherZone
                                                      ? ' · Otra zona'
                                                      : ''}
                                            </span>
                                            {active && (
                                                <Check className="absolute top-2 right-2 size-4" />
                                            )}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </section>
                ))}
            </div>

            <SheetFooter>
                <Button
                    type="button"
                    size="lg"
                    className="h-14 rounded-2xl text-base font-bold"
                    disabled={unchanged || invalid}
                    onClick={() => onConfirm(selected)}
                >
                    Guardar mesas
                </Button>
            </SheetFooter>
        </>
    );
}

export function ChangeTablesSheet({ open, onOpenChange, ...rest }: Props) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <ResponsiveSheetContent>
                {open && <Picker {...rest} />}
            </ResponsiveSheetContent>
        </Sheet>
    );
}
