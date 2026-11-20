import { router, usePage } from '@inertiajs/react';
import { useConnectionStatus, useEcho } from '@laravel/echo-react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useCan } from '@/hooks/use-can';
import { useLiveReload } from '@/hooks/use-live-reload';
import { realtimeEnabled } from '@/lib/echo';
import { playTone, unlockAudio } from '@/lib/sound';
import { index as kitchenIndex } from '@/routes/kitchen';
import { show } from '@/routes/orders';

type TicketEvent = {
    round_id: number;
    order_id: number;
    waiter_id: number;
    label: string;
    kind: 'new' | 'cancelled' | 'item_cancelled' | 'stage' | 'updated';
    stage: number;
    stage_label: string;
};

const READY = 3;
const seen = new Map<string, number>();

function isFresh(event: TicketEvent): boolean {
    const key = `${event.round_id}:${event.kind}:${event.stage}`;
    const now = Date.now();

    for (const [stored, at] of seen) {
        if (now - at > 5000) {
            seen.delete(stored);
        }
    }

    if (seen.has(key)) {
        return false;
    }

    seen.set(key, now);

    return true;
}

function FloorChannel({ branchId }: { branchId: number }) {
    const { auth } = usePage().props;
    const reload = useLiveReload();

    useEcho(`branch.${branchId}.floor`, '.floor.changed', reload);

    useEcho<TicketEvent>(
        `branch.${branchId}.floor`,
        '.kitchen.ticket',
        (event) => {
            reload();

            if (
                event.kind === 'stage' &&
                event.stage === READY &&
                event.waiter_id === auth.user.id &&
                isFresh(event)
            ) {
                playTone('ready');
                toast.success(`${event.label}: pedido listo para recoger`, {
                    duration: 12000,
                    action: {
                        label: 'Ver cuenta',
                        onClick: () => router.visit(show(event.order_id)),
                    },
                });
            }
        },
    );

    return null;
}

function KitchenChannel({ branchId }: { branchId: number }) {
    const reload = useLiveReload(150);

    useEcho<TicketEvent>(
        `branch.${branchId}.kitchen`,
        '.kitchen.ticket',
        (event) => {
            reload();

            if (!isFresh(event)) {
                return;
            }

            if (event.kind === 'new') {
                playTone('new-order');
                toast.info(`Nuevo pedido: ${event.label}`, {
                    duration: 10000,
                    action: {
                        label: 'Ver',
                        onClick: () => router.visit(kitchenIndex()),
                    },
                });
            }

            if (event.kind === 'cancelled' && event.stage >= 1) {
                playTone('alert');
                toast.error(`Pedido anulado: ${event.label}. No lo prepares.`, {
                    duration: 15000,
                });
            }

            if (event.kind === 'item_cancelled' && event.stage >= 1) {
                playTone('alert');
                toast.error(`Se anuló un plato de ${event.label}.`, {
                    duration: 15000,
                });
            }
        },
    );

    return null;
}

function CashChannel({ branchId }: { branchId: number }) {
    const reload = useLiveReload();

    useEcho(`branch.${branchId}.cash`, '.floor.changed', reload);

    return null;
}

function Reconnect() {
    const status = useConnectionStatus();
    const reload = useLiveReload(0);
    const previous = useRef(status);

    useEffect(() => {
        if (previous.current !== 'connected' && status === 'connected') {
            reload();
        }

        previous.current = status;
    }, [status, reload]);

    return null;
}

export function Realtime() {
    const { branch } = usePage().props;
    const can = useCan();
    const branchId = branch?.id;

    useEffect(() => {
        const unlock = () => void unlockAudio();

        window.addEventListener('pointerdown', unlock);
        window.addEventListener('keydown', unlock);

        return () => {
            window.removeEventListener('pointerdown', unlock);
            window.removeEventListener('keydown', unlock);
        };
    }, []);

    if (!branchId || !realtimeEnabled) {
        return null;
    }

    return (
        <>
            <Reconnect />
            {can('sales.create') && <FloorChannel branchId={branchId} />}
            {can('kitchen.view') && <KitchenChannel branchId={branchId} />}
            {(can('cash.open') || can('sales.charge')) && (
                <CashChannel branchId={branchId} />
            )}
        </>
    );
}
