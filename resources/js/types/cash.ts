import type { OrderSummary } from '@/types/floor';

export type PaymentMethod = 'cash' | 'yape' | 'plin' | 'card';

export type MethodOption = { value: PaymentMethod; label: string };

export type PaymentView = {
    id: number;
    order_id: number;
    order_label?: string;
    method: PaymentMethod;
    method_label: string;
    amount_cents: number;
    tendered_cents: number;
    change_cents: number;
    reference: string | null;
    user_name?: string;
    created_at: string;
    voided_at: string | null;
    can_void: boolean;
};

export type CashSessionView = {
    id: number;
    opened_at: string;
    closed_at: string | null;
    opened_by_name?: string;
    opening_cents: number;
    expected_cents: number | null;
    counted_cents: number | null;
    difference_cents: number | null;
    can_close: boolean;
    can_undo_open: boolean;
    can_reopen: boolean;
};

export type OpenCashSession = CashSessionView & {
    totals: Record<PaymentMethod, number>;
    cash_sales_cents: number;
    payments_count: number;
    expected_cents: number;
};

export type ReceiptLine = {
    id: number;
    name: string;
    variant: string;
    quantity: number;
    unit_price_cents: number;
    total_cents: number;
};

export type ReceiptOrder = OrderSummary & {
    paid_at: string | null;
    paid_cents: number;
    remaining_cents: number;
    branch: { name: string; address: string | null; phone: string | null };
    lines: ReceiptLine[];
    payments: PaymentView[];
};

export type OrderToCollect = OrderSummary & { paid_cents: number };
