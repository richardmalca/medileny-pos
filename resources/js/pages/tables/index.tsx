import { Head, Link } from '@inertiajs/react';
import { Archive, ArchiveRestore, Plus, Users } from 'lucide-react';
import { ZoneForm } from '@/components/tables/zone-form';
import { Button } from '@/components/ui/button';
import { useConfirmedAction } from '@/hooks/use-confirmed-action';
import { visit } from '@/lib/feedback';
import { cn } from '@/lib/utils';
import { create, edit, index } from '@/routes/tables';
import { status } from '@/routes/zones';
import type { OptionItem, Zone } from '@/types/floor';

type Props = {
    branches: OptionItem[];
    branch_id: number;
    zones: Zone[];
};

export default function TablesIndex({
    branches,
    branch_id: branchId,
    zones,
}: Props) {
    const run = useConfirmedAction();

    const toggleZone = (zone: Zone) => {
        const next = !zone.is_active;

        return run({
            confirm: {
                title: next
                    ? `¿Reactivar la zona ${zone.name}?`
                    : `¿Archivar la zona ${zone.name}?`,
                description: next
                    ? 'Sus mesas volverán a aparecer en la pantalla Mesas.'
                    : 'Sus mesas dejarán de aparecer en la pantalla Mesas.',
                confirmLabel: next ? 'Reactivar' : 'Archivar',
                destructive: !next,
            },
            messages: {
                loading: next ? 'Reactivando zona…' : 'Archivando zona…',
                success: next ? 'Zona reactivada' : 'Zona archivada',
                error: 'No se pudo cambiar la zona',
            },
            run: () => visit(status(zone.id), { is_active: next }),
            undo: () => visit(status(zone.id), { is_active: !next }),
        });
    };

    return (
        <>
            <Head title="Salón" />

            <div className="flex w-full flex-col gap-6 pb-10">
                <header>
                    <p className="text-sm font-semibold text-muted-foreground">
                        Zonas y mesas
                    </p>
                    <h1 className="display text-4xl md:text-4xl">Salón</h1>
                </header>

                {branches.length > 1 && (
                    <div
                        role="tablist"
                        aria-label="Sucursales"
                        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0"
                    >
                        {branches.map((branch) => (
                            <Link
                                key={branch.id}
                                href={index({ query: { branch: branch.id } })}
                                role="tab"
                                aria-selected={branch.id === branchId}
                                className={cn(
                                    'flex min-h-11 shrink-0 items-center rounded-full px-4 text-sm font-bold ring-1 ring-border',
                                    branch.id === branchId
                                        ? 'bg-primary text-primary-foreground ring-transparent'
                                        : 'bg-card',
                                )}
                            >
                                {branch.name.replace(
                                    'Pollería Medileny - ',
                                    '',
                                )}
                            </Link>
                        ))}
                    </div>
                )}

                <ZoneForm branchId={branchId} />

                {zones.length === 0 && (
                    <p className="rounded-3xl bg-card p-8 text-center text-muted-foreground ring-1 ring-border">
                        Esta sucursal aún no tiene zonas. Crea la primera
                        arriba.
                    </p>
                )}

                {zones.map((zone) => (
                    <section
                        key={zone.id}
                        aria-labelledby={`zone-${zone.id}`}
                        className={cn(
                            'flex flex-col gap-3',
                            !zone.is_active && 'opacity-75',
                        )}
                    >
                        <div className="flex items-center justify-between gap-3">
                            <h2
                                id={`zone-${zone.id}`}
                                className="display text-2xl"
                            >
                                {zone.name}
                                {!zone.is_active && (
                                    <span className="ml-2 text-sm font-semibold text-muted-foreground">
                                        Archivada
                                    </span>
                                )}
                            </h2>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="size-11 rounded-full"
                                    aria-label={
                                        zone.is_active
                                            ? `Archivar ${zone.name}`
                                            : `Reactivar ${zone.name}`
                                    }
                                    onClick={() => toggleZone(zone)}
                                >
                                    {zone.is_active ? (
                                        <Archive className="size-5" />
                                    ) : (
                                        <ArchiveRestore className="size-5" />
                                    )}
                                </Button>
                                <Button
                                    asChild
                                    size="sm"
                                    className="h-11 gap-1 rounded-full px-4 font-bold"
                                >
                                    <Link
                                        href={create({
                                            query: {
                                                branch: branchId,
                                                zone: zone.id,
                                            },
                                        })}
                                    >
                                        <Plus className="size-4" />
                                        Mesa
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        <ul className="grid grid-cols-2 gap-3 md:grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))]">
                            {zone.tables.map((table) => (
                                <li key={table.id}>
                                    <Link
                                        href={edit(table.id)}
                                        prefetch
                                        className={cn(
                                            'flex min-h-20 flex-col justify-between rounded-2xl bg-card p-3 ring-1 ring-border transition-transform duration-150 active:scale-[0.97]',
                                            !table.is_active && 'opacity-70',
                                        )}
                                    >
                                        <span className="font-bold">
                                            {table.name}
                                        </span>
                                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <Users className="size-4" />
                                            {table.capacity}
                                            {!table.is_active && ' · Archivada'}
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </section>
                ))}
            </div>
        </>
    );
}

TablesIndex.layout = {
    breadcrumbs: [{ title: 'Salón', href: index() }],
};
