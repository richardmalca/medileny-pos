import { Head } from '@inertiajs/react';
import { TableForm } from '@/components/tables/table-form';
import { create, index, store } from '@/routes/tables';
import type { OptionItem } from '@/types/floor';

type Props = {
    branch: OptionItem;
    zones: OptionItem[];
    zone_id: number | null;
};

export default function TablesCreate({
    branch,
    zones,
    zone_id: zoneId,
}: Props) {
    return (
        <>
            <Head title="Nueva mesa" />

            <div className="flex w-full max-w-5xl flex-col gap-4">
                <header>
                    <p className="text-sm font-semibold text-muted-foreground">
                        {branch.name}
                    </p>
                    <h1 className="display text-2xl">Nueva mesa</h1>
                </header>

                <div className="max-w-2xl rounded-2xl bg-card p-5 ring-1 ring-border">
                    <TableForm
                        form={store.form()}
                        branchId={branch.id}
                        zones={zones}
                        defaultZoneId={zoneId}
                        submitLabel="Crear mesa"
                    />
                </div>
            </div>
        </>
    );
}

TablesCreate.layout = {
    breadcrumbs: [
        { title: 'Salón', href: index() },
        { title: 'Nueva mesa', href: create() },
    ],
};
