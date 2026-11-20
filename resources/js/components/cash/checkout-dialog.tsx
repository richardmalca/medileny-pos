import { router } from '@inertiajs/react';
import { useCallback, useState } from 'react';
import { CheckoutBody } from '@/components/cash/checkout-body';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { MethodOption, ReceiptOrder } from '@/types/cash';

type Url = (query?: { pay?: number }) => string;

/**
 * Estado del diálogo de cobro. Abrirlo pide la cuenta al servidor con `?pay=ID`
 * sin cambiar de página; cerrarlo quita el parámetro.
 */
export function useCheckoutDialog(url: Url) {
    const [payId, setPayId] = useState<number | null>(null);

    const visit = useCallback(
        (target: string) =>
            router.get(
                target,
                {},
                {
                    only: ['checkout'],
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                },
            ),
        [],
    );

    const open = useCallback(
        (id: number) => {
            setPayId(id);
            visit(url({ pay: id }));
        },
        [url, visit],
    );

    const close = useCallback(() => {
        setPayId(null);
        visit(url());
    }, [url, visit]);

    return { payId, open, close };
}

/** Mismo esqueleto que el formulario, para que el modal no cambie de tamaño al cargar. */
function CheckoutSkeleton() {
    return (
        <div
            aria-hidden="true"
            className="grid animate-pulse gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]"
        >
            <div className="flex flex-col gap-3">
                <div className="h-28 rounded-2xl bg-muted" />
                <div className="h-40 rounded-2xl bg-muted/70" />
            </div>
            <div className="flex flex-col gap-3">
                <div className="h-16 rounded-2xl bg-muted" />
                <div className="h-12 rounded-xl bg-muted/70" />
                <div className="h-12 rounded-xl bg-muted/70" />
                <div className="h-14 rounded-2xl bg-muted" />
            </div>
        </div>
    );
}

export function CheckoutDialog({
    payId,
    checkout,
    sessionOpen,
    methods,
    onClose,
}: {
    payId: number | null;
    checkout: ReceiptOrder | null;
    sessionOpen: boolean;
    methods: MethodOption[];
    onClose: () => void;
}) {
    const order = checkout !== null && checkout.id === payId ? checkout : null;

    return (
        <Dialog
            open={payId !== null}
            onOpenChange={(open) => !open && onClose()}
        >
            <DialogContent className="no-scrollbar max-h-[92svh] min-h-[28rem] w-[min(64rem,calc(100%-2rem))] max-w-none content-start overflow-y-auto rounded-3xl sm:max-w-none">
                <DialogHeader>
                    <DialogTitle className="display text-2xl">
                        {order ? `Cobrar ${order.label}` : 'Cobrar'}
                    </DialogTitle>
                    <DialogDescription>
                        {order
                            ? `Cuenta #${order.number}`
                            : 'Cargando la cuenta…'}
                    </DialogDescription>
                </DialogHeader>
                {order ? (
                    <CheckoutBody
                        order={order}
                        sessionOpen={sessionOpen}
                        methods={methods}
                        inline
                        onPaidFully={onClose}
                    />
                ) : (
                    <CheckoutSkeleton />
                )}
            </DialogContent>
        </Dialog>
    );
}
