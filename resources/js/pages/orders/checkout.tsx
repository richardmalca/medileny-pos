import { Head } from '@inertiajs/react';
import { CheckoutBody } from '@/components/cash/checkout-body';
import { index as cashIndex } from '@/routes/cash';
import type { MethodOption, ReceiptOrder } from '@/types/cash';

type Props = {
    order: ReceiptOrder;
    session_open: boolean;
    methods: MethodOption[];
};

export default function OrdersCheckout({
    order,
    session_open: sessionOpen,
    methods,
}: Props) {
    return (
        <>
            <Head title={`Cobrar ${order.label}`} />

            <div className="flex w-full flex-col gap-6 pb-24">
                <header>
                    <p className="text-sm font-semibold text-muted-foreground">
                        Cobrar · Cuenta #{order.number}
                    </p>
                    <h1 className="display text-4xl md:text-3xl">
                        {order.label}
                    </h1>
                </header>

                <CheckoutBody
                    order={order}
                    sessionOpen={sessionOpen}
                    methods={methods}
                />
            </div>
        </>
    );
}

OrdersCheckout.layout = {
    breadcrumbs: [{ title: 'Cobrar', href: cashIndex() }],
};
