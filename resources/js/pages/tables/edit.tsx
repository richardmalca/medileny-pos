import { Head } from '@inertiajs/react';
import { Archive, ArchiveRestore } from 'lucide-react';
import { TableForm } from '@/components/tables/table-form';
import { Button } from '@/components/ui/button';
import { useConfirmedAction } from '@/hooks/use-confirmed-action';
import { visit } from '@/lib/feedback';
import { index, status, update } from '@/routes/tables';
import type { FloorTable, OptionItem } from '@/types/floor';

type Props = {
    table: FloorTable;
    branch_id: number;
    zones: OptionItem[];
};

export default function TablesEdit({
    table,
    branch_id: branchId,
    zones,
}: Props) {
    const run = useConfirmedAction();

    const toggle = () => {
        const next = !table.is_active;

        return run({
            confirm: {
                title: next
                    ? `¿Reactivar la ${table.name}?`
                    : `¿Archivar la ${table.name}?`,
                description: next
                    ? 'Volverá a aparecer en la pantalla Mesas.'
                    : 'Dejará de aparecer en la pantalla Mesas. Su historial se conserva.',
                confirmLabel: next ? 'Reactivar' : 'Archivar',
                destructive: !next,
            },
            messages: {
                loading: next ? 'Reactivando mesa…' : 'Archivando mesa…',
                success: next ? 'Mesa reactivada' : 'Mesa archivada',
                error: 'No se pudo cambiar la mesa',
            },
            run: () => visit(status(table.id), { is_active: next }),
            undo: () => visit(status(table.id), { is_active: !next }),
        });
    };

    return (
        <>
            <Head title={table.name} />

            <div className="flex w-full max-w-5xl flex-col gap-4">
                <header>
                    <p className="text-sm font-semibold text-muted-foreground">
                        Salón
                    </p>
                    <h1 className="display text-2xl">{table.name}</h1>
                </header>

                <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                    <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
                        <TableForm
                            form={update.form(table.id)}
                            branchId={branchId}
                            zones={zones}
                            table={table}
                            submitLabel="Guardar cambios"
                        />
                    </div>
                    <section className="flex flex-col gap-3 rounded-2xl bg-card p-5 ring-1 ring-border">
                        <div>
                            <h2 className="font-bold">
                                {table.is_active
                                    ? 'Archivar mesa'
                                    : 'Reactivar mesa'}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {table.is_active
                                    ? 'Deja de mostrarse al tomar pedidos. No se puede archivar mientras está ocupada.'
                                    : 'Volverá a mostrarse al tomar pedidos.'}
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant={
                                table.is_active ? 'destructive' : 'default'
                            }
                            size="lg"
                            className="h-12 gap-2 rounded-xl font-bold"
                            onClick={toggle}
                        >
                            {table.is_active ? (
                                <Archive className="size-5" />
                            ) : (
                                <ArchiveRestore className="size-5" />
                            )}
                            {table.is_active ? 'Archivar' : 'Reactivar'}
                        </Button>
                    </section>
                </div>
            </div>
        </>
    );
}

TablesEdit.layout = {
    breadcrumbs: [
        { title: 'Salón', href: index() },
        { title: 'Editar', href: index() },
    ],
};
