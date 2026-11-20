import { router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useRef } from 'react';

const LIVE_PROPS = [
    'zones',
    'loose_orders',
    'tickets',
    'session',
    'to_collect',
    'recent_payments',
    'history',
    'order',
    'table_options',
    'detail',
    'checkout',
    'can_add',
    'categories',
    'stats',
    'server_now',
];

export function useLiveReload(delay = 250): () => void {
    const page = usePage();
    const keys = useRef<string[]>([]);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        keys.current = LIVE_PROPS.filter((key) => key in page.props);
    }, [page.props]);

    useEffect(
        () => () => {
            if (timer.current) {
                clearTimeout(timer.current);
            }
        },
        [],
    );

    return useCallback(() => {
        if (timer.current) {
            clearTimeout(timer.current);
        }

        timer.current = setTimeout(() => {
            if (keys.current.length > 0) {
                router.reload({ only: keys.current });
            }
        }, delay);
    }, [delay]);
}
