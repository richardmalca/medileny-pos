import { useConfirmedAction } from '@/hooks/use-confirmed-action';
import { visit } from '@/lib/feedback';
import { formatClock } from '@/lib/time';
import { cancel, restore, served } from '@/routes/orders';
import { cancel as cancelItem, restore as restoreItem } from '@/routes/items';
import {
    cancel as cancelRound,
    restore as restoreRound,
} from '@/routes/rounds';
import { update as updateTables } from '@/routes/orders/tables';
import type {
    OrderDetail,
    Round,
    RoundItem,
    TableOptionZone,
} from '@/types/floor';

/**
 * Acciones sobre una cuenta abierta (anular tandas, quitar platos, marcar
 * entregas, cambiar mesas, cancelar). Cada una confirma, muestra el toast de
 * progreso y ofrece "Deshacer". Las usan la página de la cuenta y el panel de
 * Mesas en PC.
 */
export function useOrderActions(
    order: OrderDetail,
    tableOptions: TableOptionZone[],
) {
    const run = useConfirmedAction();

    const tableName = (id: number) =>
        tableOptions
            .flatMap((zone) => zone.tables)
            .find((table) => table.id === id)?.name ?? `mesa ${id}`;

    const changeRound = (round: Round, cancelling: boolean) =>
        run({
            confirm: {
                title: cancelling
                    ? `¿Anular la tanda de las ${formatClock(round.sent_at)}?`
                    : `¿Restaurar la tanda de las ${formatClock(round.sent_at)}?`,
                description: cancelling
                    ? 'Los platos de esa tanda dejarán de contar en la cuenta.'
                    : undefined,
                confirmLabel: cancelling ? 'Anular tanda' : 'Restaurar',
                destructive: cancelling,
            },
            messages: {
                loading: cancelling ? 'Anulando tanda…' : 'Restaurando tanda…',
                success: cancelling ? 'Tanda anulada' : 'Tanda restaurada',
                error: 'No se pudo cambiar la tanda',
            },
            run: () =>
                visit((cancelling ? cancelRound : restoreRound)(round.id)),
            undo: () =>
                visit((cancelling ? restoreRound : cancelRound)(round.id)),
        });

    const changeItem = (item: RoundItem, cancelling: boolean) =>
        run({
            confirm: {
                title: cancelling
                    ? `¿Quitar ${item.quantity} × ${item.product_name} (${item.variant_name})?`
                    : `¿Restaurar ${item.quantity} × ${item.product_name}?`,
                description: cancelling
                    ? 'Se descontará de la cuenta.'
                    : undefined,
                confirmLabel: cancelling ? 'Quitar' : 'Restaurar',
                destructive: cancelling,
            },
            messages: {
                loading: cancelling ? 'Quitando plato…' : 'Restaurando plato…',
                success: cancelling ? 'Plato quitado' : 'Plato restaurado',
                error: 'No se pudo cambiar el plato',
            },
            run: () => visit((cancelling ? cancelItem : restoreItem)(item.id)),
            undo: () => visit((cancelling ? restoreItem : cancelItem)(item.id)),
        });

    const serve = (items: RoundItem[], isServed: boolean) => {
        const ids = items.map((item) => item.id);
        const label =
            items.length === 1
                ? items[0].product_name
                : `${items.length} platos`;

        return run({
            confirm: {
                title: isServed
                    ? `¿Marcar ${label} como entregado?`
                    : `¿Quitar la entrega de ${label}?`,
                confirmLabel: isServed ? 'Entregado' : 'Quitar entrega',
            },
            messages: {
                loading: 'Actualizando entrega…',
                success: isServed
                    ? 'Marcado como entregado'
                    : 'Entrega deshecha',
                error: 'No se pudo actualizar la entrega',
            },
            run: () =>
                visit(served(order.id), { served: isServed, item_ids: ids }),
            undo: () =>
                visit(served(order.id), { served: !isServed, item_ids: ids }),
        });
    };

    const moveTables = (ids: number[]) => {
        const names = ids.map(tableName).join(' + ');

        return run({
            confirm: {
                title:
                    ids.length === 0
                        ? '¿Liberar la mesa?'
                        : `¿Pasar la cuenta a ${names}?`,
                description:
                    ids.length === 0
                        ? 'La cuenta sigue abierta, pero la mesa queda libre.'
                        : 'Las mesas anteriores quedarán libres.',
                confirmLabel: ids.length === 0 ? 'Liberar' : 'Cambiar',
            },
            messages: {
                loading: 'Cambiando mesas…',
                success:
                    ids.length === 0 ? 'Mesa liberada' : `Cuenta en ${names}`,
                error: 'No se pudieron cambiar las mesas',
            },
            run: () => visit(updateTables(order.id), { table_ids: ids }),
            undo: () =>
                visit(updateTables(order.id), { table_ids: order.table_ids }),
        });
    };

    const changeAccount = (cancelling: boolean) =>
        run({
            confirm: {
                title: cancelling
                    ? `¿Cancelar la cuenta de ${order.label}?`
                    : `¿Restaurar la cuenta de ${order.label}?`,
                description: cancelling
                    ? 'Se anula el pedido completo y las mesas quedan libres.'
                    : 'La cuenta vuelve a abrirse con sus mesas.',
                confirmLabel: cancelling ? 'Cancelar cuenta' : 'Restaurar',
                destructive: cancelling,
            },
            messages: {
                loading: cancelling
                    ? 'Cancelando cuenta…'
                    : 'Restaurando cuenta…',
                success: cancelling ? 'Cuenta cancelada' : 'Cuenta restaurada',
                error: 'No se pudo cambiar la cuenta',
            },
            run: () => visit((cancelling ? cancel : restore)(order.id)),
            undo: () => visit((cancelling ? restore : cancel)(order.id)),
        });

    return { changeRound, changeItem, serve, moveTables, changeAccount };
}
