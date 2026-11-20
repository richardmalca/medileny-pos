import { Link } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import { useCan } from '@/hooks/use-can';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import { edit as editBranch } from '@/routes/branch';
import { edit } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import type { NavItem } from '@/types';

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();
    const can = useCan();

    const items: NavItem[] = [
        { title: 'Perfil', href: edit(), icon: null },
        { title: 'Seguridad', href: editSecurity(), icon: null },
        { title: 'Apariencia y avisos', href: editAppearance(), icon: null },
        ...(can('branch.manage')
            ? [{ title: 'Sucursal', href: editBranch(), icon: null }]
            : []),
    ];

    return (
        <div className="flex w-full flex-col gap-4 pb-6">
            <header>
                <p className="text-sm font-semibold text-muted-foreground">
                    Tu cuenta y el local
                </p>
                <h1 className="display text-2xl">Ajustes</h1>
            </header>

            <nav
                aria-label="Ajustes"
                className="no-scrollbar flex gap-2 overflow-x-auto"
            >
                {items.map((item) => {
                    const active = isCurrentOrParentUrl(item.href);

                    return (
                        <Link
                            key={toUrl(item.href)}
                            href={item.href}
                            aria-current={active ? 'page' : undefined}
                            className={cn(
                                'shrink-0 rounded-full px-4 py-2 text-sm font-bold ring-1 ring-border transition-colors duration-150',
                                active
                                    ? 'bg-primary text-primary-foreground ring-transparent'
                                    : 'bg-card hover:bg-muted',
                            )}
                        >
                            {item.title}
                        </Link>
                    );
                })}
            </nav>

            <div className="w-full">{children}</div>
        </div>
    );
}
