export type KitchenTicketItem = {
    id: number;
    quantity: number;
    product_name: string;
    variant_name: string;
    note: string | null;
    cancelled: boolean;
};

export type KitchenTicket = {
    id: number;
    order_id: number;
    label: string;
    type: string;
    type_label: string;
    customer_name: string | null;
    waiter_name: string;
    sent_at: string;
    received_at: string | null;
    preparing_at: string | null;
    ready_at: string | null;
    handed_at: string | null;
    cancelled_at: string | null;
    stage: number;
    stage_label: string;
    next_stage: number | null;
    next_label: string | null;
    previous_stage: number | null;
    can_update: boolean;
    items: KitchenTicketItem[];
};

export const STAGE = {
    New: 0,
    Received: 1,
    Preparing: 2,
    Ready: 3,
    Handed: 4,
} as const;

/** Colores por etapa: el mismo código en columnas, tarjetas y botones. */
export const STAGE_THEME: Record<
    number,
    { column: string; dot: string; card: string; button: string }
> = {
    [STAGE.New]: {
        column: 'bg-brand-yellow/25 ring-brand-yellow/60',
        dot: 'bg-brand-yellow',
        card: 'border-l-brand-yellow',
        button: 'bg-brand-yellow text-foreground hover:bg-brand-yellow/85',
    },
    [STAGE.Received]: {
        column: 'bg-brand-yellow/25 ring-brand-yellow/60',
        dot: 'bg-brand-yellow',
        card: 'border-l-brand-yellow',
        button: 'bg-brand-yellow text-foreground hover:bg-brand-yellow/85',
    },
    [STAGE.Preparing]: {
        column: 'bg-brand-orange/15 ring-brand-orange/50',
        dot: 'bg-brand-orange',
        card: 'border-l-brand-orange',
        button: 'bg-brand-orange text-foreground hover:bg-brand-orange/85',
    },
    [STAGE.Ready]: {
        column: 'bg-brand-green/10 ring-brand-green/40',
        dot: 'bg-brand-green',
        card: 'border-l-brand-green',
        button: 'bg-brand-green text-white hover:bg-brand-green/90',
    },
    [STAGE.Handed]: {
        column: 'bg-muted/50 ring-border',
        dot: 'bg-muted-foreground',
        card: 'border-l-muted-foreground',
        button: 'bg-foreground text-background hover:bg-foreground/90',
    },
};
