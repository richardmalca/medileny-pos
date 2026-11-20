import { ChefHat, CircleCheck, Flame, Inbox, PackageCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STAGE } from '@/types/kitchen';

const styles: Record<number, { className: string; icon: typeof Inbox }> = {
    [STAGE.New]: { className: 'bg-muted text-muted-foreground', icon: Inbox },
    [STAGE.Received]: {
        className: 'bg-secondary text-secondary-foreground',
        icon: CircleCheck,
    },
    [STAGE.Preparing]: {
        className: 'bg-brand-yellow/60 text-accent-foreground',
        icon: Flame,
    },
    [STAGE.Ready]: {
        className: 'bg-brand-green/20 text-brand-green',
        icon: PackageCheck,
    },
    [STAGE.Handed]: {
        className: 'bg-muted text-muted-foreground',
        icon: ChefHat,
    },
};

export function KitchenBadge({
    stage,
    label,
    className,
}: {
    stage: number | null;
    label: string | null;
    className?: string;
}) {
    if (stage === null || label === null) {
        return null;
    }

    const { className: tone, icon: Icon } = styles[stage];

    return (
        <span
            className={cn(
                'inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold',
                tone,
                className,
            )}
        >
            <Icon className="size-3.5" />
            Cocina: {label}
        </span>
    );
}
