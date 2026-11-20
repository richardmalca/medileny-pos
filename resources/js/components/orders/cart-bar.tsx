import { ShoppingBag } from 'lucide-react';
import { formatMoney } from '@/lib/money';

export function CartBar({
    count,
    total,
    onOpen,
}: {
    count: number;
    total: number;
    onOpen: () => void;
}) {
    if (count === 0) {
        return null;
    }

    return (
        <button
            type="button"
            onClick={onOpen}
            className="bg-brand-gradient fixed inset-x-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-30 flex min-h-16 items-center justify-between rounded-2xl px-5 text-white shadow-xl transition-transform duration-150 active:scale-[0.98] md:right-8 md:bottom-8 md:left-auto md:w-96"
        >
            <span className="flex items-center gap-3 font-bold">
                <ShoppingBag className="size-6" />
                Ver pedido · {count} {count === 1 ? 'ítem' : 'ítems'}
            </span>
            <span className="display text-2xl">{formatMoney(total)}</span>
        </button>
    );
}
