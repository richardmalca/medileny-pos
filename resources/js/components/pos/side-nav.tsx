import { Link } from '@inertiajs/react';
import AppLogo from '@/components/app-logo';
import { navGroupLabels } from '@/config/navigation';
import type { NavGroup, PosNavItem } from '@/config/navigation';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useNavItems } from '@/hooks/use-nav-items';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';

const order: NavGroup[] = ['operation', 'admin', 'account'];

export function SideNav() {
    const { isCurrentUrl } = useCurrentUrl();
    const items = useNavItems();

    const groups = order
        .map((group) => ({
            group,
            items: items.filter((item) => item.group === group),
        }))
        .filter((entry) => entry.items.length > 0);

    const renderItem = ({ title, icon: Icon, href }: PosNavItem) => {
        const active = isCurrentUrl(href);

        return (
            <li key={title}>
                <Link
                    href={href}
                    prefetch
                    title={title}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                        'flex min-h-10 items-center justify-center gap-2.5 rounded-xl px-0 text-sm font-semibold transition-colors duration-150 2xl:justify-start 2xl:px-3',
                        active
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent',
                    )}
                >
                    <Icon className="size-5" />
                    <span className="sr-only 2xl:not-sr-only">{title}</span>
                </Link>
            </li>
        );
    };

    return (
        <aside className="no-scrollbar sticky top-0 hidden h-svh w-16 shrink-0 flex-col gap-5 overflow-y-auto border-r bg-sidebar px-2 py-4 md:flex 2xl:w-52 2xl:px-3 print:hidden">
            <Link href={dashboard()} className="px-0 2xl:px-3" prefetch>
                <AppLogo className="justify-center 2xl:justify-start [&>span:last-child]:hidden 2xl:[&>span:last-child]:block" />
            </Link>
            <nav
                aria-label="Navegación principal"
                className="flex flex-1 flex-col gap-4"
            >
                {groups.map(({ group, items: groupItems }) => (
                    <div
                        key={group}
                        className={cn(
                            'flex flex-col gap-1',
                            group === 'account' && 'mt-auto border-t pt-3',
                        )}
                    >
                        {group !== 'account' && (
                            <>
                                <p className="hidden px-3 text-[11px] font-bold tracking-wider text-muted-foreground uppercase 2xl:block">
                                    {navGroupLabels[group]}
                                </p>
                                <span
                                    aria-hidden="true"
                                    className={cn(
                                        'mx-2 border-t 2xl:hidden',
                                        group === 'operation' && 'hidden',
                                    )}
                                />
                            </>
                        )}
                        <ul className="flex flex-col gap-0.5">
                            {groupItems.map(renderItem)}
                        </ul>
                    </div>
                ))}
            </nav>
        </aside>
    );
}
