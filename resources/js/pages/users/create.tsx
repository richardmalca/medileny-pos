import { Head } from '@inertiajs/react';
import { UserForm } from '@/components/users/user-form';
import { create, index, store } from '@/routes/users';
import type { BranchOption, RoleOption } from '@/types/users';

export default function UsersCreate({
    roles,
    branches,
}: {
    roles: RoleOption[];
    branches: BranchOption[];
}) {
    return (
        <>
            <Head title="Nuevo usuario" />

            <div className="flex w-full max-w-5xl flex-col gap-4">
                <header>
                    <p className="text-sm font-semibold text-muted-foreground">
                        Equipo
                    </p>
                    <h1 className="display text-2xl">Nuevo usuario</h1>
                </header>

                <div className="max-w-2xl rounded-2xl bg-card p-5 ring-1 ring-border">
                    <UserForm
                        form={store.form()}
                        roles={roles}
                        branches={branches}
                        submitLabel="Crear usuario"
                    />
                </div>
            </div>
        </>
    );
}

UsersCreate.layout = {
    breadcrumbs: [
        { title: 'Equipo', href: index() },
        { title: 'Nuevo', href: create() },
    ],
};
