import { useCallback, useMemo, useState } from 'react';
import type { SetStateAction } from 'react';
import { usePersistedState } from '@/hooks/use-persisted-state';
import type { CartLine } from '@/types/orders';

const MAX_QUANTITY = 50;

type Drafts = Record<string, CartLine[]>;

const EMPTY: CartLine[] = [];

/**
 * Carrito con un borrador por "contexto" (`scope`): el pedido nuevo y cada
 * cuenta abierta tienen el suyo, así no se mezclan al cambiar de mesa.
 */
export function useCart(storageKey?: string, scope = 'default') {
    const local = useState<Drafts>({});
    const persisted = usePersistedState<Drafts>(
        storageKey ?? 'cart:unused',
        {},
    );
    const [drafts, setDrafts] = storageKey ? persisted : local;
    const lines = drafts[scope] ?? EMPTY;

    const setLines = useCallback(
        (update: SetStateAction<CartLine[]>) => {
            setDrafts((current) => {
                const previous = current[scope] ?? EMPTY;
                const next =
                    typeof update === 'function' ? update(previous) : update;
                const rest = { ...current };

                if (next.length === 0) {
                    delete rest[scope];

                    return rest;
                }

                return { ...rest, [scope]: next };
            });
        },
        [setDrafts, scope],
    );

    const add = useCallback(
        (incoming: CartLine) => {
            setLines((current) => {
                const found = current.some(
                    (line) => line.variantId === incoming.variantId,
                );

                return found
                    ? current.map((line) =>
                          line.variantId === incoming.variantId
                              ? {
                                    ...line,
                                    quantity: Math.min(
                                        line.quantity + incoming.quantity,
                                        MAX_QUANTITY,
                                    ),
                                }
                              : line,
                      )
                    : [...current, incoming];
            });
        },
        [setLines],
    );

    const setQuantity = useCallback(
        (variantId: number, quantity: number) => {
            setLines((current) =>
                quantity <= 0
                    ? current.filter((line) => line.variantId !== variantId)
                    : current.map((line) =>
                          line.variantId === variantId
                              ? {
                                    ...line,
                                    quantity: Math.min(quantity, MAX_QUANTITY),
                                }
                              : line,
                      ),
            );
        },
        [setLines],
    );

    const setNote = useCallback(
        (variantId: number, note: string) => {
            setLines((current) =>
                current.map((line) =>
                    line.variantId === variantId ? { ...line, note } : line,
                ),
            );
        },
        [setLines],
    );

    const clear = useCallback(() => setLines([]), [setLines]);

    const total = useMemo(
        () =>
            lines.reduce(
                (sum, line) => sum + line.priceCents * line.quantity,
                0,
            ),
        [lines],
    );

    const count = useMemo(
        () => lines.reduce((sum, line) => sum + line.quantity, 0),
        [lines],
    );

    return { lines, add, setQuantity, setNote, clear, total, count };
}
