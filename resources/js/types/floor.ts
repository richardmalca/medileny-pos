import type { OrderType } from '@/types/orders';

export type OrderSummary = {
    id: number;
    number: number;
    type: OrderType;
    type_label: string;
    label: string;
    status: string;
    customer_name: string | null;
    total_cents: number;
    table_names: string[];
    table_ids: number[];
    kitchen_stage: number | null;
    kitchen_label: string | null;
    items_count: number;
    opened_at: string | null;
    waiting_since: string | null;
};

export type FloorTable = {
    id: number;
    zone_id: number;
    name: string;
    capacity: number;
    is_active: boolean;
    order: OrderSummary | null;
};

export type Zone = {
    id: number;
    name: string;
    is_active: boolean;
    tables: FloorTable[];
};

export type Thresholds = { warn: number; alert: number };

export type RoundItem = {
    id: number;
    product_name: string;
    variant_name: string;
    quantity: number;
    unit_price_cents: number;
    note: string | null;
    needs_kitchen: boolean;
    served_at: string | null;
    cancelled_at: string | null;
    changeable_until: string | null;
    can_cancel: boolean;
    can_restore: boolean;
    can_serve: boolean;
    can_unserve: boolean;
};

export type Round = {
    id: number;
    sent_at: string;
    cancelled_at: string | null;
    user_name: string;
    kitchen_stage: number | null;
    kitchen_label: string | null;
    received_at: string | null;
    preparing_at: string | null;
    ready_at: string | null;
    handed_at: string | null;
    subtotal_cents: number;
    can_cancel: boolean;
    can_restore: boolean;
    items: RoundItem[];
};

export type OrderDetail = OrderSummary & {
    customer_phone: string | null;
    delivery_address: string | null;
    change_window_minutes: number;
    paid_cents: number;
    can_charge: boolean;
    can_receipt: boolean;
    can_cancel: boolean;
    can_restore: boolean;
    can_move_tables: boolean;
    rounds: Round[];
};

export type TableOption = {
    id: number;
    name: string;
    capacity: number;
    selectable: boolean;
};

export type TableOptionZone = {
    id: number;
    name: string;
    tables: TableOption[];
};

export type ContextTable = { id: number; name: string; capacity: number };

export type OptionItem = { id: number; name: string };
