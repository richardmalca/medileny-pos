import { Undo2 } from 'lucide-react';
import { ElapsedBadge } from '@/components/floor/elapsed-badge';
import { Button } from '@/components/ui/button';
import { formatClock } from '@/lib/time';
import { cn } from '@/lib/utils';
import type { Thresholds } from '@/types/floor';
import type { KitchenTicket } from '@/types/kitchen';
import { STAGE, STAGE_THEME } from '@/types/kitchen';

type Props = {
    ticket: KitchenTicket;
    now: number;
    thresholds: Thresholds;
    onAdvance: (ticket: KitchenTicket) => void;
    onBack: (ticket: KitchenTicket) => void;
};

function timeline(ticket: KitchenTicket): string {
    return [
        ['Recibido', ticket.received_at],
        ['Preparando', ticket.preparing_at],
        ['Listo', ticket.ready_at],
        ['Entregado', ticket.handed_at],
    ]
        .filter((entry): entry is [string, string] => entry[1] !== null)
        .map(([name, at]) => `${name} ${formatClock(at)}`)
        .join(' · ');
}

export function KitchenTicketCard({
    ticket,
    now,
    thresholds,
    onAdvance,
    onBack,
}: Props) {
    const cancelled = ticket.cancelled_at !== null;
    const started = timeline(ticket);

    return (
        <li
            className={cn(
                'flex flex-col gap-1.5 rounded-xl border-l-4 bg-card p-2.5 ring-1 ring-border',
                STAGE_THEME[ticket.stage]?.card,
                cancelled && 'bg-destructive/10 ring-destructive/40',
            )}
        >
            {cancelled && (
                <p className="rounded-lg bg-destructive px-2 py-1 text-center text-xs font-bold text-white">
                    ANULADO · no preparar
                </p>
            )}

            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="display truncate text-lg leading-tight">
                        {ticket.label}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                        {ticket.type !== 'dine_in' && `${ticket.type_label} · `}
                        {ticket.customer_name && `${ticket.customer_name} · `}
                        {ticket.waiter_name.split(' ')[0]}
                    </p>
                </div>
                {!cancelled && ticket.stage < STAGE.Ready && (
                    <ElapsedBadge
                        since={ticket.sent_at}
                        now={now}
                        thresholds={thresholds}
                        prefix="Hace"
                    />
                )}
            </div>

            <ul className="flex flex-col gap-0.5">
                {ticket.items.map((item) => (
                    <li
                        key={item.id}
                        className={cn(
                            'text-sm leading-snug',
                            item.cancelled &&
                                'text-muted-foreground line-through',
                        )}
                    >
                        <span className="font-bold">
                            {item.quantity}× {item.product_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {' '}
                            · {item.variant_name}
                        </span>
                        {item.cancelled && (
                            <span className="ml-1.5 text-xs font-bold text-destructive no-underline">
                                ANULADO
                            </span>
                        )}
                        {item.note && (
                            <span className="ml-1.5 rounded bg-brand-yellow/60 px-1.5 py-0.5 text-xs font-bold text-accent-foreground">
                                {item.note}
                            </span>
                        )}
                    </li>
                ))}
            </ul>

            {started && (
                <p className="truncate text-[11px] text-muted-foreground">
                    Enviado {formatClock(ticket.sent_at)} · {started}
                </p>
            )}

            {!cancelled && ticket.can_update && (
                <div className="flex items-center gap-1.5 pt-0.5">
                    {ticket.next_stage !== null && (
                        <Button
                            type="button"
                            className={cn(
                                'h-9 min-w-0 flex-1 rounded-lg px-2 text-sm font-bold transition-transform duration-150 active:scale-[0.98]',
                                STAGE_THEME[ticket.next_stage]?.button,
                            )}
                            onClick={() => onAdvance(ticket)}
                        >
                            {ticket.next_label}
                        </Button>
                    )}
                    {ticket.previous_stage !== null &&
                        ticket.previous_stage >= STAGE.Received && (
                            <Button
                                type="button"
                                variant="ghost"
                                className="h-9 shrink-0 gap-1 rounded-lg px-2 text-xs font-bold text-muted-foreground"
                                aria-label="Volver al paso anterior"
                                onClick={() => onBack(ticket)}
                            >
                                <Undo2 className="size-3.5" />
                                Atrás
                            </Button>
                        )}
                </div>
            )}
        </li>
    );
}
