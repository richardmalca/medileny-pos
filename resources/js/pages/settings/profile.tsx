import { Form, Head, usePage } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { useConfirmedForm } from '@/hooks/use-confirmed-form';
import { visit } from '@/lib/feedback';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { edit } from '@/routes/profile';
import type { Auth } from '@/types';
import { send } from '@/routes/verification';

type PageProps = {
    auth: Auth;
};

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage<PageProps>().props;

    const confirmed = useConfirmedForm({
        confirm: {
            title: '¿Guardar los cambios de tu perfil?',
            confirmLabel: 'Guardar',
        },
        messages: {
            loading: 'Guardando perfil…',
            success: 'Perfil actualizado',
            error: 'No se pudo actualizar el perfil',
        },
        undo: () => () =>
            visit(ProfileController.update(), {
                name: auth.user.name,
                email: auth.user.email,
            }),
    });

    return (
        <>
            <Head title="Perfil" />

            <h1 className="sr-only">Perfil</h1>

            <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                <div className="space-y-6 rounded-2xl bg-card p-5 ring-1 ring-border">
                    <Heading
                        variant="small"
                        title="Perfil"
                        description="Actualiza tu nombre y correo"
                    />

                    <Form
                        {...ProfileController.update.form()}
                        {...confirmed}
                        options={{
                            preserveScroll: true,
                        }}
                        className="space-y-6"
                    >
                        {({ processing, errors }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Nombre</Label>

                                    <Input
                                        id="name"
                                        className="mt-1 block w-full"
                                        defaultValue={auth.user.name}
                                        name="name"
                                        required
                                        autoComplete="name"
                                        placeholder="Tu nombre"
                                    />

                                    <InputError
                                        className="mt-2"
                                        message={errors.name}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="email">
                                        Correo electrónico
                                    </Label>

                                    <Input
                                        id="email"
                                        type="email"
                                        className="mt-1 block w-full"
                                        defaultValue={auth.user.email}
                                        name="email"
                                        required
                                        autoComplete="username"
                                        placeholder="Correo electrónico"
                                    />

                                    <InputError
                                        className="mt-2"
                                        message={errors.email}
                                    />
                                </div>

                                {mustVerifyEmail &&
                                    auth.user.email_verified_at === null && (
                                        <div>
                                            <p className="-mt-4 text-sm text-muted-foreground">
                                                Tu correo aún no está
                                                verificado.{' '}
                                                <Link
                                                    href={send()}
                                                    as="button"
                                                    className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                                >
                                                    Haz clic aquí para reenviar
                                                    el correo de verificación.
                                                </Link>
                                            </p>

                                            {status ===
                                                'verification-link-sent' && (
                                                <div className="mt-2 text-sm font-medium text-green-600">
                                                    Se envió un nuevo enlace de
                                                    verificación a tu correo.
                                                </div>
                                            )}
                                        </div>
                                    )}

                                <div className="flex items-center gap-4">
                                    <Button
                                        disabled={processing}
                                        data-test="update-profile-button"
                                    >
                                        Guardar
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form>
                </div>

                <AccountCard />
            </div>
        </>
    );
}

const permissionLabels: Record<string, string> = {
    'sales.create': 'Registrar ventas',
    'sales.void': 'Anular ventas',
    'sales.charge': 'Cobrar cuentas',
    'cash.open': 'Abrir caja',
    'cash.close': 'Cerrar caja',
    'kitchen.view': 'Ver la cocina',
    'reports.view': 'Ver reportes',
    'menu.manage': 'Gestionar la carta',
    'inventory.manage': 'Gestionar el inventario',
    'tables.manage': 'Gestionar mesas y zonas',
    'users.manage': 'Gestionar el equipo',
    'branch.manage': 'Configurar la sucursal',
};

/** Quién eres en el sistema: rol, sucursal y lo que puedes hacer. */
function AccountCard() {
    const { auth, branch } = usePage<PageProps>().props;

    return (
        <section
            aria-label="Tu cuenta"
            className="flex flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-border"
        >
            <Heading
                variant="small"
                title="Tu cuenta en el sistema"
                description="Tu rol lo define el administrador del local"
            />
            <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                    <dt className="text-xs font-semibold text-muted-foreground">
                        Rol
                    </dt>
                    <dd className="font-bold">{auth.role ?? 'Sin rol'}</dd>
                </div>
                <div>
                    <dt className="text-xs font-semibold text-muted-foreground">
                        Sucursal
                    </dt>
                    <dd className="font-bold">
                        {branch?.name ?? 'Sin sucursal'}
                    </dd>
                </div>
            </dl>
            <div>
                <p className="mb-2 text-xs font-semibold text-muted-foreground">
                    Lo que puedes hacer
                </p>
                <ul className="flex flex-wrap gap-1.5">
                    {auth.permissions.map((permission) => (
                        <li
                            key={permission}
                            className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold"
                        >
                            {permissionLabels[permission] ?? permission}
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Perfil',
            href: edit(),
        },
    ],
};
