import { Form, Link } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { useConfirmedForm } from '@/hooks/use-confirmed-form';
import { visit } from '@/lib/feedback';
import { destroy, index, update } from '@/routes/tables';
import type { OptionItem } from '@/types/floor';
import type { RouteFormDefinition } from '@/wayfinder';

type TableValues = {
    id: number;
    name: string;
    capacity: number;
    zone_id: number;
};

type Props = {
    form: RouteFormDefinition<'post'>;
    branchId: number;
    zones: OptionItem[];
    table?: TableValues;
    defaultZoneId?: number | null;
    submitLabel: string;
};

export function TableForm({
    form,
    branchId,
    zones,
    table,
    defaultZoneId,
    submitLabel,
}: Props) {
    const confirmed = useConfirmedForm({
        confirm: (data) =>
            table
                ? {
                      title: `¿Guardar los cambios de ${table.name}?`,
                      confirmLabel: 'Guardar',
                  }
                : {
                      title: `¿Crear ${String(data.name)}?`,
                      description: `Capacidad para ${String(data.capacity)} personas.`,
                      confirmLabel: 'Crear mesa',
                  },
        messages: table
            ? {
                  loading: 'Guardando mesa…',
                  success: 'Mesa actualizada',
                  error: 'No se pudo guardar la mesa',
              }
            : {
                  loading: 'Creando mesa…',
                  success: 'Mesa creada',
                  error: 'No se pudo crear la mesa',
              },
        undo: ({ flash }) => {
            if (table) {
                return () =>
                    visit(update(table.id), {
                        zone_id: table.zone_id,
                        name: table.name,
                        capacity: table.capacity,
                    });
            }

            const createdId = flash.created_id;

            return createdId === undefined
                ? undefined
                : () => visit(destroy(createdId));
        },
    });

    return (
        <Form {...form} {...confirmed} className="flex flex-col gap-5">
            {({ processing, errors }) => (
                <>
                    {!table && (
                        <input
                            type="hidden"
                            name="branch_id"
                            value={branchId}
                        />
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="name">Nombre</Label>
                        <Input
                            id="name"
                            name="name"
                            defaultValue={table?.name}
                            required
                            autoFocus
                            autoComplete="off"
                            placeholder="Ej. Mesa 12"
                            className="h-12 rounded-xl"
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="zone_id">Zona</Label>
                        <Select
                            name="zone_id"
                            defaultValue={
                                table
                                    ? String(table.zone_id)
                                    : defaultZoneId
                                      ? String(defaultZoneId)
                                      : undefined
                            }
                            required
                        >
                            <SelectTrigger
                                id="zone_id"
                                className="h-12 w-full rounded-xl"
                            >
                                <SelectValue placeholder="Elige una zona" />
                            </SelectTrigger>
                            <SelectContent>
                                {zones.map((zone) => (
                                    <SelectItem
                                        key={zone.id}
                                        value={String(zone.id)}
                                    >
                                        {zone.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.zone_id} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="capacity">Capacidad (personas)</Label>
                        <Input
                            id="capacity"
                            name="capacity"
                            type="number"
                            inputMode="numeric"
                            min={1}
                            max={20}
                            defaultValue={table?.capacity ?? 4}
                            required
                            className="h-12 rounded-xl"
                        />
                        <InputError message={errors.capacity} />
                    </div>

                    <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                        <Button
                            asChild
                            variant="outline"
                            size="lg"
                            className="h-12 rounded-xl"
                        >
                            <Link href={index({ query: { branch: branchId } })}>
                                Cancelar
                            </Link>
                        </Button>
                        <Button
                            size="lg"
                            disabled={processing}
                            className="h-12 rounded-xl font-bold"
                        >
                            {processing && <Spinner />}
                            {submitLabel}
                        </Button>
                    </div>
                </>
            )}
        </Form>
    );
}
