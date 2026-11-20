import { Form } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useConfirmedForm } from '@/hooks/use-confirmed-form';
import { visit } from '@/lib/feedback';
import { destroy, store } from '@/routes/zones';

export function ZoneForm({ branchId }: { branchId: number }) {
    const confirmed = useConfirmedForm({
        confirm: (data) => ({
            title: `¿Crear la zona ${String(data.name)}?`,
            description: 'Después podrás agregarle mesas.',
            confirmLabel: 'Crear zona',
        }),
        messages: {
            loading: 'Creando zona…',
            success: 'Zona creada',
            error: 'No se pudo crear la zona',
        },
        undo: ({ flash }) =>
            flash.created_id === undefined
                ? undefined
                : () => visit(destroy(flash.created_id as number)),
    });

    return (
        <Form
            {...store.form()}
            {...confirmed}
            options={{ preserveScroll: true }}
            resetOnSuccess
            className="flex flex-col gap-2"
        >
            {({ errors, processing }) => (
                <>
                    <input type="hidden" name="branch_id" value={branchId} />
                    <div className="flex gap-2">
                        <Input
                            name="name"
                            required
                            maxLength={60}
                            autoComplete="off"
                            aria-label="Nombre de la nueva zona"
                            placeholder="Nueva zona (ej. Terraza)"
                            className="h-12 rounded-xl"
                        />
                        <Button
                            size="lg"
                            disabled={processing}
                            className="h-12 shrink-0 gap-2 rounded-xl font-bold"
                        >
                            <Plus className="size-5" />
                            Zona
                        </Button>
                    </div>
                    <InputError message={errors.name} />
                </>
            )}
        </Form>
    );
}
