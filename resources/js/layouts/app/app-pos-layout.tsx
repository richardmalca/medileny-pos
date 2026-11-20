import type { ReactNode } from 'react';
import { BottomNav } from '@/components/pos/bottom-nav';
import { Realtime } from '@/components/realtime/realtime';
import { SideNav } from '@/components/pos/side-nav';
import { TopBar } from '@/components/pos/top-bar';

export default function AppPosLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-svh bg-background">
            <SideNav />
            <div className="flex min-w-0 flex-1 flex-col">
                <TopBar />
                <main className="flex-1 px-4 pt-4 pb-28 md:px-6 md:pb-8 lg:pb-6">
                    {children}
                </main>
            </div>
            <BottomNav />
            <Realtime />
        </div>
    );
}
