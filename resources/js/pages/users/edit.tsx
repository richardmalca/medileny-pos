import { Head, usePage } from '@inertiajs/react';
import { UserCheck, UserX } from 'lucide-react';
import { RoleBadge } from '@/components/users/role-badge';
import { UserForm } from '@/components/users/user-form';
import { Button } from '@/components/ui/button';
import { useConfirmedAction } from '@/hooks/use-confirmed-action';
import { visit } from '@/lib/feedback';
import { index, status, update } from '@/routes/users';
import type { BranchOption, Member, RoleOption } from '@/types/users';

export default function UsersEdit({
    member,
    roles,
    branches,
}: {
    member: Member;
    roles: RoleOption[];
    branches: BranchOption[];
}) {
    const { auth } = usePage().props;
    const isSelf = auth.user.id === member.id;

    const run = useConfirmedAction();

    const toggleAccess = () => {
        const next = !member.is_active;

        return run({
            confirm: {
                title: next
                    ? `¿Devolver el acceso a ${member.name}?`
                    : `¿Quitar el acceso a ${member.name}?`,
                description: next
                    ? 'Podrá volver a iniciar sesión.'
                    : 'No podrá iniciar sesión, pero su historial se conserva.',
                confirmLabel: next ? 'Reactivar' : 'Desactivar',
                destructive: !next,
            },
            messages: {
                loading: next ? 'Reactivando acceso…' : 'Desactivando acceso…',
                success: next ? 'Acceso reactivado' : 'Acceso desactivado',
                error: 'No se pudo cambiar el acceso',
            },
            run: () => visit(status(member.id), { is_active: next }),
            undo: () => visit(status(member.id), { is_active: !next }),
        });
    };

    return (
        <>
            <Head title={member.name} />

            <div className="flex w-full max-w-5xl flex-col gap-4">
                <header className="flex flex-col gap-2">
                    <p className="text-sm font-semibold text-muted-foreground">
                        Equipo
                    </p>
                    <h1 className="display text-2xl">{member.name}</h1>
                    <div className="flex items-center gap-2">
                        <RoleBadge
                            role={member.role}
                            label={member.role_label}
                        />
                        {!member.is_active && (
                            <span className="text-sm font-semibold text-destructive">
                                Sin acceso
                            </span>
                        )}
                    </div>
                </header>

                <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                    <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
                        <UserForm
                            form={update.form(member.id)}
                            member={member}
                            roles={roles}
                            branches={branches}
                            submitLabel="Guardar cambios"
                        />
                    </div>
                    {!isSelf && (
                        <section className="flex flex-col gap-3 rounded-2xl bg-card p-5 ring-1 ring-border">
                            <div>
                                <h2 className="font-bold">Acceso al sistema</h2>
                                <p className="text-sm text-muted-foreground">
                                    {member.is_active
                                        ? 'No podrá iniciar sesión, pero su historial se conserva.'
                                        : 'Podrá volver a iniciar sesión con su rol actual.'}
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant={
                                    member.is_active ? 'destructive' : 'default'
                                }
                                size="lg"
                                className="h-12 gap-2 rounded-xl font-bold"
                                onClick={toggleAccess}
                            >
                                {member.is_active ? (
                                    <UserX className="size-5" />
                                ) : (
                                    <UserCheck className="size-5" />
                                )}
                                {member.is_active
                                    ? 'Desactivar acceso'
                                    : 'Reactivar acceso'}
                            </Button>
                        </section>
                    )}
                </div>
            </div>
        </>
    );
}

UsersEdit.layout = {
    breadcrumbs: [
        { title: 'Equipo', href: index() },
        { title: 'Editar', href: index() },
    ],
};
