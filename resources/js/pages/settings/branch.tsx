import { Form, Head } from '@inertiajs/react';
import { Clock, History, Timer } from 'lucide-react';
import BranchController from '@/actions/App/Http/Controllers/Settings/BranchController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useConfirmedForm } from '@/hooks/use-confirmed-form';
import { visit } from '@/lib/feedback';
import { edit } from '@/routes/branch';

type Branch = {
    name: string;
    code: string;
    address: string | null;
    phone: string | null;
    warn_after_minutes: number;
    alert_after_minutes: number;
    change_window_minutes: number;
};

export default function BranchSettings({ branch }: { branch: Branch }) {
    const confirmed = useConfirmedForm({
        confirm: {
            title: '¿Guardar la configuración de la sucursal?',
            description:
                'Los tiempos de aviso y de cambios se aplican de inmediato en las mesas, la cocina y la caja de esta sucursal.',
            confirmLabel: 'Guardar',
        },
        messages: {
            loading: 'Guardando sucursal…',
            success: 'Sucursal actualizada',
            error: 'No se pudo guardar la sucursal',
        },
        undo: () => () =>
            visit(BranchController.update(), {
                name: branch.name,
                address: branch.address ?? '',
                phone: branch.phone ?? '',
                warn_after_minutes: branch.warn_after_minutes,
                alert_after_minutes: branch.alert_after_minutes,
                change_window_minutes: branch.change_window_minutes,
            }),
    });

    return (
        <>
            <Head title="Sucursal" />

            <h1 className="sr-only">Sucursal</h1>

            <Form
                {...BranchController.update.form()}
                {...confirmed}
                options={{ preserveScroll: true }}
                className="grid items-start gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="flex flex-col gap-6 rounded-2xl bg-card p-5 ring-1 ring-border">
                            <section className="flex flex-col gap-4">
                                <Heading
                                    variant="small"
                                    title="Datos del local"
                                    description={`Código ${branch.code}`}
                                />
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Nombre</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        defaultValue={branch.name}
                                        required
                                        maxLength={80}
                                        className="h-11 rounded-xl"
                                    />
                                    <InputError message={errors.name} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="address">Dirección</Label>
                                    <Input
                                        id="address"
                                        name="address"
                                        defaultValue={branch.address ?? ''}
                                        maxLength={255}
                                        className="h-11 rounded-xl"
                                    />
                                    <InputError message={errors.address} />
                                </div>
                                <div className="grid gap-2 sm:max-w-xs">
                                    <Label htmlFor="phone">Teléfono</Label>
                                    <Input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        defaultValue={branch.phone ?? ''}
                                        maxLength={30}
                                        className="h-11 rounded-xl"
                                    />
                                    <InputError message={errors.phone} />
                                </div>
                            </section>

                            <section className="flex flex-col gap-4 border-t pt-6">
                                <Heading
                                    variant="small"
                                    title="Tiempos"
                                    description="Cuánto esperar antes de avisar y cuánto se puede cambiar un pedido"
                                />
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <Minutes
                                        id="warn_after_minutes"
                                        label="Aviso (amarillo)"
                                        value={branch.warn_after_minutes}
                                        error={errors.warn_after_minutes}
                                    />
                                    <Minutes
                                        id="alert_after_minutes"
                                        label="Alerta (rojo)"
                                        value={branch.alert_after_minutes}
                                        error={errors.alert_after_minutes}
                                    />
                                    <Minutes
                                        id="change_window_minutes"
                                        label="Cambios"
                                        value={branch.change_window_minutes}
                                        error={errors.change_window_minutes}
                                    />
                                </div>
                            </section>

                            <div className="flex items-center gap-4">
                                <Button
                                    disabled={processing}
                                    className="h-11 rounded-xl px-6 font-bold"
                                >
                                    Guardar cambios
                                </Button>
                            </div>
                        </div>

                        <aside className="flex flex-col gap-3 rounded-2xl bg-card p-5 ring-1 ring-border">
                            <Heading
                                variant="small"
                                title="¿Qué hace cada tiempo?"
                                description="Se miden en minutos"
                            />
                            <Help
                                icon={Clock}
                                title="Aviso"
                                text="La mesa o el pedido se pone en amarillo cuando lleva esta espera sin atención."
                            />
                            <Help
                                icon={Timer}
                                title="Alerta"
                                text="Pasado este tiempo se marca en rojo. Debe ser mayor que el aviso."
                            />
                            <Help
                                icon={History}
                                title="Cambios"
                                text="Tiempo en que un mozo puede quitar o corregir un plato de cocina. Las bebidas se pueden cambiar hasta entregarlas. El administrador no tiene límite."
                            />
                        </aside>
                    </>
                )}
            </Form>
        </>
    );
}

function Minutes({
    id,
    label,
    value,
    error,
}: {
    id: string;
    label: string;
    value: number;
    error?: string;
}) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={id}>{label}</Label>
            <div className="flex items-center gap-2">
                <Input
                    id={id}
                    name={id}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={240}
                    defaultValue={value}
                    required
                    className="h-11 rounded-xl"
                />
                <span className="text-sm text-muted-foreground">min</span>
            </div>
            <InputError message={error} />
        </div>
    );
}

function Help({
    icon: Icon,
    title,
    text,
}: {
    icon: typeof Clock;
    title: string;
    text: string;
}) {
    return (
        <div className="flex gap-3 rounded-xl bg-muted/50 p-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-card ring-1 ring-border">
                <Icon className="size-4" />
            </span>
            <div>
                <p className="text-sm font-bold">{title}</p>
                <p className="text-xs text-muted-foreground">{text}</p>
            </div>
        </div>
    );
}

BranchSettings.layout = {
    breadcrumbs: [{ title: 'Sucursal', href: edit() }],
};
