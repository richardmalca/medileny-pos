import { Head, Link } from '@inertiajs/react';
import { Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { RoleBadge } from '@/components/users/role-badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { create, edit, index } from '@/routes/users';
import type { Member } from '@/types/users';

export default function UsersIndex({ users }: { users: Member[] }) {
    const getInitials = useInitials();
    const [search, setSearch] = useState('');
    const [role, setRole] = useState<string | null>(null);

    const roles = useMemo(() => {
        const counts = new Map<string, number>();

        users.forEach((user) => {
            const label = user.role_label ?? 'Sin rol';

            counts.set(label, (counts.get(label) ?? 0) + 1);
        });

        return [...counts.entries()];
    }, [users]);

    const visible = useMemo(() => {
        const term = search.trim().toLowerCase();

        return users
            .filter(
                (user) =>
                    role === null || (user.role_label ?? 'Sin rol') === role,
            )
            .filter(
                (user) =>
                    term === '' ||
                    `${user.name} ${user.email} ${user.role_label ?? ''} ${user.branch_name ?? ''}`
                        .toLowerCase()
                        .includes(term),
            );
    }, [users, search, role]);

    return (
        <>
            <Head title="Equipo" />

            <div className="flex w-full flex-col gap-6">
                <header className="flex items-end justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold text-muted-foreground">
                            {users.length} personas
                        </p>
                        <h1 className="display text-3xl">Equipo</h1>
                    </div>
                    <Button
                        asChild
                        size="lg"
                        className="h-12 gap-2 rounded-2xl font-bold"
                    >
                        <Link href={create()}>
                            <Plus className="size-5" />
                            Nuevo
                        </Link>
                    </Button>
                </header>

                <div className="relative">
                    <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Buscar por nombre, rol o sucursal"
                        aria-label="Buscar en el equipo"
                        className="h-12 rounded-2xl pl-12"
                    />
                </div>

                <div
                    role="tablist"
                    aria-label="Filtrar por rol"
                    className="no-scrollbar -mt-2 flex gap-2 overflow-x-auto"
                >
                    {[['Todos', users.length] as const, ...roles].map(
                        ([label, count]) => {
                            const value = label === 'Todos' ? null : label;

                            return (
                                <button
                                    key={label}
                                    type="button"
                                    role="tab"
                                    aria-selected={role === value}
                                    onClick={() => setRole(value)}
                                    className={cn(
                                        'shrink-0 rounded-full px-4 py-2 text-sm font-bold ring-1 ring-border transition-colors duration-150',
                                        role === value
                                            ? 'bg-primary text-primary-foreground ring-transparent'
                                            : 'bg-card hover:bg-muted',
                                    )}
                                >
                                    {label} · {count}
                                </button>
                            );
                        },
                    )}
                </div>

                {visible.length === 0 ? (
                    <p className="rounded-3xl bg-card p-8 text-center text-muted-foreground ring-1 ring-border">
                        No encontramos a nadie con esa búsqueda.
                    </p>
                ) : (
                    <ul className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
                        {visible.map((user) => (
                            <li key={user.id}>
                                <Link
                                    href={edit(user.id)}
                                    prefetch
                                    className={cn(
                                        'flex items-center gap-4 rounded-3xl bg-card p-4 ring-1 ring-border transition-transform duration-150 active:scale-[0.98]',
                                        !user.is_active && 'opacity-60',
                                    )}
                                >
                                    <Avatar className="size-12">
                                        <AvatarFallback className="bg-brand-gradient font-bold text-white">
                                            {getInitials(user.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-bold">
                                            {user.name}
                                        </p>
                                        <p className="truncate text-sm text-muted-foreground">
                                            {user.branch_name}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <RoleBadge
                                            role={user.role}
                                            label={user.role_label}
                                        />
                                        {!user.is_active && (
                                            <span className="text-xs font-semibold text-destructive">
                                                Sin acceso
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </>
    );
}

UsersIndex.layout = {
    breadcrumbs: [{ title: 'Equipo', href: index() }],
};
