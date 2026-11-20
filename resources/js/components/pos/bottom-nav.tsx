import { Link } from '@inertiajs/react';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useNavItems } from '@/hooks/use-nav-items';
import { cn } from '@/lib/utils';

export function BottomNav() {
    const { isCurrentUrl } = useCurrentUrl();
    const items = useNavItems();

    return (
        <nav
            aria-label="Navegación principal"
            className="fixed inset-x-0 bottom-0 z-40 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden print:hidden"
        >
            <ul
                className="grid"
                style={{
                    gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
                }}
            >
                {items.map(({ title, icon: Icon, href }) => {
                    const active = isCurrentUrl(href);

                    return (
                        <li key={title}>
                            <Link
                                href={href}
                                prefetch
                                aria-current={active ? 'page' : undefined}
                                className="flex min-h-16 flex-col items-center justify-center gap-1 active:scale-95"
                            >
                                <span
                                    className={cn(
                                        'grid h-8 w-12 place-items-center rounded-full transition-colors duration-150',
                                        active &&
                                            'bg-primary text-primary-foreground',
                                    )}
                                >
                                    <Icon className="size-5" />
                                </span>
                                <span
                                    className={cn(
                                        'text-xs font-semibold',
                                        active && 'text-primary',
                                    )}
                                >
                                    {title}
                                </span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
