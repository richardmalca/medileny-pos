import { Clock } from 'lucide-react';
import { formatMinutes, minutesSince, urgencyOf } from '@/lib/time';
import type { Urgency } from '@/lib/time';
import { cn } from '@/lib/utils';
import type { Thresholds } from '@/types/floor';

const styles: Record<Urgency, string> = {
    ok: 'bg-brand-green/20 text-brand-green',
    warn: 'bg-brand-yellow/60 text-accent-foreground',
    alert: 'bg-destructive/15 text-destructive',
};

export function ElapsedBadge({
    since,
    now,
    thresholds,
    prefix,
}: {
    since: string | null;
    now: number;
    thresholds: Thresholds;
    prefix?: string;
}) {
    if (since === null) {
        return null;
    }

    const minutes = minutesSince(since, now);

    return (
        <span
            className={cn(
                'inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap tabular-nums',
                styles[urgencyOf(minutes, thresholds)],
            )}
        >
            <Clock className="size-3.5" />
            {prefix} {formatMinutes(minutes)}
        </span>
    );
}
