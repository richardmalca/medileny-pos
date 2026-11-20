import { Head, usePoll } from '@inertiajs/react';
import { useState } from 'react';
import { KitchenTicketCard } from '@/components/kitchen/kitchen-ticket';
import { useConfirmedAction } from '@/hooks/use-confirmed-action';
import { useNow } from '@/hooks/use-now';
import { visit } from '@/lib/feedback';
import { cn } from '@/lib/utils';
import { index } from '@/routes/kitchen';
import { kitchen as kitchenStage } from '@/routes/rounds';
import type { Thresholds } from '@/types/floor';
import type { KitchenTicket } from '@/types/kitchen';
import { STAGE, STAGE_THEME } from '@/types/kitchen';

type Props = {
    tickets: KitchenTicket[];
    thresholds: Thresholds;
    server_now: string;
};

const tabs = [
    {
        key: 'todo',
        label: 'Por preparar',
        stages: [STAGE.New, STAGE.Received] as number[],
    },
    {
        key: 'preparing',
        label: 'Preparando',
        stages: [STAGE.Preparing] as number[],
    },
    { key: 'ready', label: 'Listos', stages: [STAGE.Ready] as number[] },
    { key: 'handed', label: 'Entregados', stages: [STAGE.Handed] as number[] },
];

const copy: Record<
    number,
    { title: string; loading: string; success: string }
> = {
    [STAGE.Received]: {
        title: 'recibido',
        loading: 'Confirmando pedido…',
        success: 'Pedido recibido',
    },
    [STAGE.Preparing]: {
        title: 'en preparación',
        loading: 'Actualizando pedido…',
        success: 'Preparando el pedido',
    },
    [STAGE.Ready]: {
        title: 'listo',
        loading: 'Actualizando pedido…',
        success: 'Pedido listo',
    },
    [STAGE.Handed]: {
        title: 'entregado al mozo',
        loading: 'Actualizando pedido…',
        success: 'Entregado al mozo',
    },
};

export default function KitchenIndex({
    tickets,
    thresholds,
    server_now: serverNow,
}: Props) {
    usePoll(20000, { only: ['tickets', 'thresholds', 'server_now'] });

    const now = useNow(serverNow, 10000);
    const run = useConfirmedAction();
    const [tab, setTab] = useState('todo');

    const cancelled = tickets.filter((ticket) => ticket.cancelled_at !== null);
    const active = tickets.filter((ticket) => ticket.cancelled_at === null);
    const current = tabs.find((item) => item.key === tab) ?? tabs[0];
    const visible = active.filter((ticket) =>
        current.stages.includes(ticket.stage),
    );

    const move = (ticket: KitchenTicket, to: number, from: number) => {
        const text = copy[to];
        const canSkip = to === STAGE.Received;

        return run({
            confirm: {
                title: `¿Marcar ${ticket.label} como ${text.title}?`,
                confirmLabel: ticket.next_label ?? 'Confirmar',
                alternativeLabel: canSkip ? 'Recibido y preparar' : undefined,
            },
            alternative: canSkip
                ? {
                      messages: {
                          loading: 'Actualizando pedido…',
                          success: `Preparando el pedido (${ticket.label})`,
                          error: 'No se pudo actualizar el pedido',
                      },
                      run: async () => {
                          await visit(kitchenStage(ticket.id), {
                              stage: STAGE.Received,
                          });

                          return visit(kitchenStage(ticket.id), {
                              stage: STAGE.Preparing,
                          });
                      },
                      undo: async () => {
                          await visit(kitchenStage(ticket.id), {
                              stage: STAGE.Received,
                          });

                          return visit(kitchenStage(ticket.id), {
                              stage: from,
                          });
                      },
                  }
                : undefined,
            messages: {
                loading: text.loading,
                success: `${text.success} (${ticket.label})`,
                error: 'No se pudo actualizar el pedido',
            },
            run: () => visit(kitchenStage(ticket.id), { stage: to }),
            undo: () => visit(kitchenStage(ticket.id), { stage: from }),
        });
    };

    const advance = (ticket: KitchenTicket) =>
        ticket.next_stage === null
            ? undefined
            : move(ticket, ticket.next_stage, ticket.stage);

    const back = (ticket: KitchenTicket) =>
        ticket.previous_stage === null
            ? undefined
            : run({
                  confirm: {
                      title: `¿Volver ${ticket.label} al paso anterior?`,
                      confirmLabel: 'Volver',
                  },
                  messages: {
                      loading: 'Actualizando pedido…',
                      success: `${ticket.label} volvió al paso anterior`,
                      error: 'No se pudo actualizar el pedido',
                  },
                  run: () =>
                      visit(kitchenStage(ticket.id), {
                          stage: ticket.previous_stage,
                      }),
                  undo: () =>
                      visit(kitchenStage(ticket.id), { stage: ticket.stage }),
              });

    return (
        <>
            <Head title="Cocina" />

            <div className="flex w-full flex-col gap-3 pb-6 lg:gap-3">
                <header>
                    <p className="text-sm font-semibold text-muted-foreground">
                        {
                            active.filter(
                                (ticket) => ticket.stage < STAGE.Handed,
                            ).length
                        }{' '}
                        pedidos en curso
                    </p>
                    <h1 className="display text-2xl">Cocina</h1>
                </header>

                {cancelled.length > 0 && (
                    <ul className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                        {cancelled.map((ticket) => (
                            <KitchenTicketCard
                                key={ticket.id}
                                ticket={ticket}
                                now={now}
                                thresholds={thresholds}
                                onAdvance={advance}
                                onBack={back}
                            />
                        ))}
                    </ul>
                )}

                <div className="flex flex-col gap-6 lg:hidden">
                    <div
                        role="tablist"
                        aria-label="Estado de los pedidos"
                        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0"
                    >
                        {tabs.map((item) => {
                            const count = active.filter((ticket) =>
                                item.stages.includes(ticket.stage),
                            ).length;

                            return (
                                <button
                                    key={item.key}
                                    type="button"
                                    role="tab"
                                    aria-selected={tab === item.key}
                                    onClick={() => setTab(item.key)}
                                    className={cn(
                                        'min-h-10 shrink-0 rounded-full px-4 text-sm font-bold ring-1 ring-border transition-colors duration-150 active:scale-95',
                                        tab === item.key
                                            ? 'bg-primary text-primary-foreground ring-transparent'
                                            : 'bg-card',
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'mr-2 inline-block size-2.5 rounded-full align-middle',
                                            STAGE_THEME[
                                                item.stages[
                                                    item.stages.length - 1
                                                ]
                                            ].dot,
                                        )}
                                    />
                                    {item.label} · {count}
                                </button>
                            );
                        })}
                    </div>

                    {visible.length === 0 ? (
                        <p className="rounded-3xl bg-card p-10 text-center text-muted-foreground ring-1 ring-border">
                            No hay pedidos aquí.
                        </p>
                    ) : (
                        <ul className="grid gap-2 md:grid-cols-2">
                            {visible.map((ticket) => (
                                <KitchenTicketCard
                                    key={ticket.id}
                                    ticket={ticket}
                                    now={now}
                                    thresholds={thresholds}
                                    onAdvance={advance}
                                    onBack={back}
                                />
                            ))}
                        </ul>
                    )}
                </div>

                <div className="hidden gap-4 lg:grid lg:h-[calc(100svh-9.5rem)] lg:grid-cols-4">
                    {tabs.map((column) => {
                        const items = active.filter((ticket) =>
                            column.stages.includes(ticket.stage),
                        );

                        return (
                            <section
                                key={column.key}
                                aria-label={column.label}
                                className={cn(
                                    'flex min-h-0 flex-col gap-2 rounded-2xl p-2 ring-1',
                                    STAGE_THEME[
                                        column.stages[column.stages.length - 1]
                                    ].column,
                                )}
                            >
                                <h2 className="flex items-center justify-between">
                                    <span className="display flex items-center gap-2 text-base">
                                        <span
                                            className={cn(
                                                'size-3 rounded-full',
                                                STAGE_THEME[
                                                    column.stages[
                                                        column.stages.length - 1
                                                    ]
                                                ].dot,
                                            )}
                                        />
                                        {column.label}
                                    </span>
                                    <span className="rounded-full bg-card px-2 py-0.5 text-xs font-bold">
                                        {items.length}
                                    </span>
                                </h2>
                                <ul className="no-scrollbar flex min-h-0 flex-1 flex-col gap-2 overflow-x-hidden overflow-y-auto">
                                    {items.length === 0 && (
                                        <li className="py-6 text-center text-sm text-muted-foreground">
                                            Sin pedidos
                                        </li>
                                    )}
                                    {items.map((ticket) => (
                                        <KitchenTicketCard
                                            key={ticket.id}
                                            ticket={ticket}
                                            now={now}
                                            thresholds={thresholds}
                                            onAdvance={advance}
                                            onBack={back}
                                        />
                                    ))}
                                </ul>
                            </section>
                        );
                    })}
                </div>
            </div>
        </>
    );
}

KitchenIndex.layout = {
    breadcrumbs: [{ title: 'Cocina', href: index() }],
};
