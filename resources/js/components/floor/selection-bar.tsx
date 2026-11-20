import { Link } from '@inertiajs/react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { create } from '@/routes/orders';
import type { FloorTable } from '@/types/floor';

export function SelectionBar({
    tables,
    onClear,
}: {
    tables: FloorTable[];
    onClear: () => void;
}) {
    if (tables.length === 0) {
        return null;
    }

    const seats = tables.reduce((sum, table) => sum + table.capacity, 0);

    return (
        <div className="bg-brand-gradient fixed inset-x-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-30 flex items-center justify-between gap-3 rounded-2xl p-3 pl-5 text-white shadow-xl md:right-8 md:bottom-8 md:left-auto md:w-[28rem]">
            <div className="min-w-0">
                <p className="line-clamp-2 font-bold">
                    {tables.map((table) => table.name).join(' + ')}
                </p>
                <p className="text-sm text-white/85">Para {seats} personas</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-11 rounded-full text-white hover:bg-white/20 hover:text-white"
                    aria-label="Limpiar selección"
                    onClick={onClear}
                >
                    <X className="size-5" />
                </Button>
                <Button
                    asChild
                    size="lg"
                    className="h-12 rounded-xl bg-white font-bold text-foreground hover:bg-white/90"
                >
                    <Link
                        href={create({
                            query: { tables: tables.map((table) => table.id) },
                        })}
                    >
                        Tomar pedido
                    </Link>
                </Button>
            </div>
        </div>
    );
}
