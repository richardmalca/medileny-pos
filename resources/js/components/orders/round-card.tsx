import { Check, RotateCcw, Undo2, X } from 'lucide-react';
import { KitchenBadge } from '@/components/kitchen/kitchen-badge';
import { Button } from '@/components/ui/button';
import { formatMoney } from '@/lib/money';
import { formatClock } from '@/lib/time';
import { cn } from '@/lib/utils';
import type { Round, RoundItem } from '@/types/floor';

type Props = {
    round: Round;
    now: number;
    onCancelRound: (round: Round) => void;
    onRestoreRound: (round: Round) => void;
    onServe: (items: RoundItem[], served: boolean) => void;
    onCancelItem: (item: RoundItem) => void;
    onRestoreItem: (item: RoundItem) => void;
    compact?: boolean;
};

function kitchenTimes(round: Round): string {
    return [
        ['Recibido', round.received_at],
        ['Preparando', round.preparing_at],
        ['Listo', round.ready_at],
        ['Entregado al mozo', round.handed_at],
    ]
        .filter((entry): entry is [string, string] => entry[1] !== null)
        .map(([name, at]) => `${name} ${formatClock(at)}`)
        .join(' · ');
}

function itemHint(item: RoundItem, now: number): string | null {
    if (item.cancelled_at) {
        return 'Anulado';
    }

    if (item.served_at) {
        return `Entregado a las ${formatClock(item.served_at)}`;
    }

    if (!item.needs_kitchen) {
        return 'Se puede cambiar hasta entregarlo';
    }

    if (item.changeable_until && Date.parse(item.changeable_until) > now) {
        return `Se puede cambiar hasta las ${formatClock(item.changeable_until)}`;
    }

    return 'Ya no se puede cambiar';
}

export function RoundCard({
    round,
    now,
    onCancelRound,
    onRestoreRound,
    onServe,
    onCancelItem,
    onRestoreItem,
    compact = false,
}: Props) {
    const iconButton = compact ? 'size-9 rounded-full' : 'size-11 rounded-full';
    const pillButton = compact ? 'h-8 px-3 text-xs' : 'h-11 px-4';
    const pending = round.items.filter((item) => item.can_serve);

    return (
        <li
            className={cn(
                'flex flex-col rounded-3xl bg-card ring-1 ring-border',
                compact ? 'gap-2 p-3' : 'gap-3 p-4',
                round.cancelled_at && 'opacity-60',
            )}
        >
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <p className="font-bold">
                        {formatClock(round.sent_at)}
                        {round.cancelled_at && ' · Anulada'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {round.user_name}
                    </p>
                    <KitchenBadge
                        className="mt-1"
                        stage={round.kitchen_stage}
                        label={round.kitchen_label}
                    />
                    {kitchenTimes(round) && (
                        <p className="mt-1 text-xs text-muted-foreground">
                            {kitchenTimes(round)}
                        </p>
                    )}
                </div>
                <div className="flex flex-wrap gap-2">
                    {pending.length > 1 && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className={`gap-1 rounded-full font-bold ${pillButton}`}
                            onClick={() => onServe(pending, true)}
                        >
                            <Check className="size-4" />
                            Todo entregado
                        </Button>
                    )}
                    {round.can_cancel && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className={`gap-1 rounded-full font-bold ${pillButton} text-destructive`}
                            onClick={() => onCancelRound(round)}
                        >
                            <X className="size-4" />
                            Anular tanda
                        </Button>
                    )}
                    {round.can_restore && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className={`gap-1 rounded-full font-bold ${pillButton}`}
                            onClick={() => onRestoreRound(round)}
                        >
                            <RotateCcw className="size-4" />
                            Restaurar
                        </Button>
                    )}
                </div>
            </div>

            <ul className="flex flex-col gap-3">
                {round.items.map((item) => {
                    const hint = itemHint(item, now);

                    return (
                        <li
                            key={item.id}
                            className="flex items-start justify-between gap-3"
                        >
                            <div
                                className={cn(
                                    item.cancelled_at && 'line-through',
                                )}
                            >
                                <p>
                                    <span className="font-semibold">
                                        {item.quantity} × {item.product_name}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        {' '}
                                        · {item.variant_name}
                                    </span>
                                </p>
                                {item.note && (
                                    <p className="text-sm text-muted-foreground">
                                        {item.note}
                                    </p>
                                )}
                                {hint && (
                                    <p
                                        className={cn(
                                            'text-xs font-semibold text-muted-foreground',
                                            item.served_at &&
                                                'text-brand-green',
                                        )}
                                    >
                                        {hint}
                                    </p>
                                )}
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                                <span className="mr-1 tabular-nums">
                                    {formatMoney(
                                        item.unit_price_cents * item.quantity,
                                    )}
                                </span>
                                {item.can_serve && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className={iconButton}
                                        aria-label={`Marcar ${item.product_name} como entregado`}
                                        onClick={() => onServe([item], true)}
                                    >
                                        <Check className="size-5" />
                                    </Button>
                                )}
                                {item.can_unserve && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className={iconButton}
                                        aria-label={`Quitar la entrega de ${item.product_name}`}
                                        onClick={() => onServe([item], false)}
                                    >
                                        <Undo2 className="size-5" />
                                    </Button>
                                )}
                                {item.can_cancel && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className={cn(
                                            iconButton,
                                            'text-destructive',
                                        )}
                                        aria-label={`Quitar ${item.product_name}`}
                                        onClick={() => onCancelItem(item)}
                                    >
                                        <X className="size-5" />
                                    </Button>
                                )}
                                {item.can_restore && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className={iconButton}
                                        aria-label={`Restaurar ${item.product_name}`}
                                        onClick={() => onRestoreItem(item)}
                                    >
                                        <RotateCcw className="size-5" />
                                    </Button>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>
        </li>
    );
}
