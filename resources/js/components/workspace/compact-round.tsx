import { Check, RotateCcw, Undo2, X } from 'lucide-react';
import { KitchenBadge } from '@/components/kitchen/kitchen-badge';
import { formatMoney } from '@/lib/money';
import { formatClock } from '@/lib/time';
import { cn } from '@/lib/utils';
import type { Round, RoundItem } from '@/types/floor';

type Props = {
    round: Round;
    onCancelRound: (round: Round) => void;
    onRestoreRound: (round: Round) => void;
    onServe: (items: RoundItem[], served: boolean) => void;
    onCancelItem: (item: RoundItem) => void;
    onRestoreItem: (item: RoundItem) => void;
    /** Mostrar también los platos anulados (por defecto se ocultan). */
    showCancelled?: boolean;
};

const icon =
    'inline-flex size-7 shrink-0 items-center justify-center rounded-full ring-1 ring-border transition-transform duration-150 hover:bg-muted active:scale-90';

/** Tanda en formato denso: una línea por plato y acciones como íconos. */
export function CompactRound({
    round,
    onCancelRound,
    onRestoreRound,
    onServe,
    onCancelItem,
    onRestoreItem,
    showCancelled = false,
}: Props) {
    const pending = round.items.filter((item) => item.can_serve);
    const items = showCancelled
        ? round.items
        : round.items.filter((item) => !item.cancelled_at);

    if (items.length === 0) {
        return null;
    }

    return (
        <li
            className={cn(
                'flex flex-col gap-1.5 rounded-xl bg-card p-2.5 ring-1 ring-border',
                round.cancelled_at && 'opacity-75',
            )}
        >
            <div className="flex items-center gap-2">
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="text-sm font-bold">
                        {formatClock(round.sent_at)}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                        {round.user_name.split(' ')[0]}
                    </span>
                    <KitchenBadge
                        stage={round.kitchen_stage}
                        label={round.kitchen_label}
                    />
                    {round.cancelled_at && (
                        <span className="text-xs font-bold text-destructive">
                            Anulada
                        </span>
                    )}
                </div>
                {pending.length > 1 && (
                    <button
                        type="button"
                        className={cn(
                            icon,
                            'w-auto gap-1 px-2 text-xs font-bold',
                        )}
                        title="Marcar todo como entregado"
                        onClick={() => onServe(pending, true)}
                    >
                        <Check className="size-3.5" />
                        Todo
                    </button>
                )}
                {round.can_cancel && (
                    <button
                        type="button"
                        className={cn(icon, 'text-destructive')}
                        aria-label="Anular tanda"
                        title="Anular tanda"
                        onClick={() => onCancelRound(round)}
                    >
                        <X className="size-4" />
                    </button>
                )}
                {round.can_restore && (
                    <button
                        type="button"
                        className={icon}
                        aria-label="Restaurar tanda"
                        title="Restaurar tanda"
                        onClick={() => onRestoreRound(round)}
                    >
                        <RotateCcw className="size-4" />
                    </button>
                )}
            </div>

            <ul className="flex flex-col divide-y divide-border/60">
                {items.map((item) => (
                    <li
                        key={item.id}
                        className="flex items-center gap-2 py-1.5 first:pt-0.5 last:pb-0"
                    >
                        <div
                            className={cn(
                                'min-w-0 flex-1',
                                item.cancelled_at &&
                                    'text-muted-foreground line-through',
                            )}
                        >
                            <p className="truncate text-sm leading-tight font-bold">
                                {item.quantity}× {item.product_name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                                {item.variant_name}
                                {item.note && ` · ${item.note}`}
                                {item.served_at && (
                                    <span className="font-semibold text-brand-green">
                                        {' '}
                                        · Entregado{' '}
                                        {formatClock(item.served_at)}
                                    </span>
                                )}
                            </p>
                        </div>
                        <span className="text-sm tabular-nums">
                            {formatMoney(item.unit_price_cents * item.quantity)}
                        </span>
                        <div className="flex shrink-0 items-center gap-1">
                            {item.can_serve && (
                                <button
                                    type="button"
                                    className={cn(icon, 'text-brand-green')}
                                    aria-label={`Marcar ${item.product_name} como entregado`}
                                    title="Entregado"
                                    onClick={() => onServe([item], true)}
                                >
                                    <Check className="size-4" />
                                </button>
                            )}
                            {item.can_unserve && (
                                <button
                                    type="button"
                                    className={icon}
                                    aria-label={`Quitar la entrega de ${item.product_name}`}
                                    title="Quitar entrega"
                                    onClick={() => onServe([item], false)}
                                >
                                    <Undo2 className="size-4" />
                                </button>
                            )}
                            {item.can_cancel && (
                                <button
                                    type="button"
                                    className={cn(icon, 'text-destructive')}
                                    aria-label={`Quitar ${item.product_name}`}
                                    title="Quitar plato"
                                    onClick={() => onCancelItem(item)}
                                >
                                    <X className="size-4" />
                                </button>
                            )}
                            {item.can_restore && (
                                <button
                                    type="button"
                                    className={icon}
                                    aria-label={`Restaurar ${item.product_name}`}
                                    title="Restaurar plato"
                                    onClick={() => onRestoreItem(item)}
                                >
                                    <RotateCcw className="size-4" />
                                </button>
                            )}
                        </div>
                    </li>
                ))}
            </ul>
        </li>
    );
}
