import { Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="flex min-h-svh flex-col bg-background">
            <div className="bg-brand-gradient relative flex flex-col items-center px-6 pt-10 pb-16">
                <Link
                    href={home()}
                    className="flex flex-col items-center gap-2"
                >
                    <AppLogoIcon className="size-28 drop-shadow-[0_8px_12px_rgba(0,0,0,0.25)]" />
                    <span className="display text-3xl text-white">
                        Pollería Medileny
                    </span>
                </Link>
                <div className="bg-stripes absolute inset-x-0 bottom-0 h-3" />
            </div>

            <div className="mt-6 flex flex-1 items-start justify-center px-4 pb-10">
                <div className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-lg ring-1 ring-border">
                    <div className="mb-6 space-y-1 text-center">
                        <h1 className="display text-2xl">{title}</h1>
                        <p className="text-sm text-muted-foreground">
                            {description}
                        </p>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
