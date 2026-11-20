import { Form, Link } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
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
import { destroy, index, update } from '@/routes/users';
import type { RouteFormDefinition } from '@/wayfinder';
import type { BranchOption, Member, RoleOption } from '@/types/users';

type Props = {
    form: RouteFormDefinition<'post'>;
    member?: Member;
    roles: RoleOption[];
    branches: BranchOption[];
    submitLabel: string;
};

export function UserForm({
    form,
    member,
    roles,
    branches,
    submitLabel,
}: Props) {
    const confirmed = useConfirmedForm({
        confirm: (data) =>
            member
                ? {
                      title: `¿Guardar los cambios de ${member.name}?`,
                      confirmLabel: 'Guardar',
                  }
                : {
                      title: `¿Crear a ${String(data.name)}?`,
                      description:
                          'Podrá iniciar sesión con este correo y contraseña.',
                      confirmLabel: 'Crear usuario',
                  },
        messages: member
            ? {
                  loading: 'Guardando cambios…',
                  success: 'Cambios guardados',
                  error: 'No se pudieron guardar los cambios',
              }
            : {
                  loading: 'Creando usuario…',
                  success: 'Usuario creado',
                  error: 'No se pudo crear el usuario',
              },
        undo: ({ flash }) => {
            if (member) {
                return () =>
                    visit(update(member.id), {
                        name: member.name,
                        email: member.email,
                        role: member.role,
                        branch_id: member.branch_id,
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
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nombre completo</Label>
                        <Input
                            id="name"
                            name="name"
                            defaultValue={member?.name}
                            required
                            autoFocus
                            autoComplete="off"
                            placeholder="Ej. Rosa Huamán"
                            className="h-12 rounded-xl"
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">Correo electrónico</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            defaultValue={member?.email}
                            required
                            autoComplete="off"
                            placeholder="rosa@medileny.com"
                            className="h-12 rounded-xl"
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password">
                            {member ? 'Nueva contraseña' : 'Contraseña'}
                        </Label>
                        <PasswordInput
                            id="password"
                            name="password"
                            required={!member}
                            autoComplete="new-password"
                            placeholder={
                                member ? 'Déjala vacía para no cambiarla' : ''
                            }
                        />
                        <InputError message={errors.password} />
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="role">Rol</Label>
                            <Select
                                name="role"
                                defaultValue={member?.role ?? undefined}
                                required
                            >
                                <SelectTrigger
                                    id="role"
                                    className="h-12 w-full rounded-xl"
                                >
                                    <SelectValue placeholder="Elige un rol" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map((role) => (
                                        <SelectItem
                                            key={role.value}
                                            value={role.value}
                                        >
                                            {role.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.role} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="branch_id">Sucursal</Label>
                            <Select
                                name="branch_id"
                                defaultValue={
                                    member?.branch_id
                                        ? String(member.branch_id)
                                        : branches.length === 1
                                          ? String(branches[0].id)
                                          : undefined
                                }
                                required
                            >
                                <SelectTrigger
                                    id="branch_id"
                                    className="h-12 w-full rounded-xl"
                                >
                                    <SelectValue placeholder="Elige una sucursal" />
                                </SelectTrigger>
                                <SelectContent>
                                    {branches.map((branch) => (
                                        <SelectItem
                                            key={branch.id}
                                            value={String(branch.id)}
                                        >
                                            {branch.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.branch_id} />
                        </div>
                    </div>

                    <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                        <Button
                            asChild
                            variant="outline"
                            size="lg"
                            className="h-12 rounded-xl"
                        >
                            <Link href={index()}>Cancelar</Link>
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
