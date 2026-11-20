import { Link, usePage } from '@inertiajs/react';
import AppLogo from '@/components/app-logo';
import { ConnectionDot } from '@/components/pos/connection-dot';
import { SoundToggle } from '@/components/pos/sound-toggle';
import { ThemeToggle } from '@/components/pos/theme-toggle';
import { UserMenu } from '@/components/pos/user-menu';
import { dashboard } from '@/routes';

export function TopBar() {
    const { branch } = usePage().props;

    return (
        <header className="sticky top-0 z-30 bg-background print:hidden">
            <div className="flex h-14 items-center justify-between px-4 md:h-11 md:px-6">
                <Link href={dashboard()} className="md:hidden" prefetch>
                    <AppLogo />
                </Link>
                <p className="hidden text-sm font-medium text-muted-foreground md:block">
                    {branch?.name}
                </p>
                <div className="flex items-center gap-1">
                    <ConnectionDot />
                    <SoundToggle />
                    <ThemeToggle />
                    <UserMenu />
                </div>
            </div>
            <div className="bg-stripes h-1" aria-hidden="true" />
        </header>
    );
}
