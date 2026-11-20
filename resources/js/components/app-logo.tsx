import Mascot from '@/components/brand/mascot';
import { cn } from '@/lib/utils';

export default function AppLogo({ className }: { className?: string }) {
    return (
        <span className={cn('flex items-center gap-2', className)}>
            <Mascot className="size-9 shrink-0" />
            <span className="display text-xl leading-none text-primary">
                Medileny
                <span className="block text-xs font-medium tracking-wide text-muted-foreground">
                    Pollería
                </span>
            </span>
        </span>
    );
}
