import { cn } from '@/lib/utils';

export function ProductVisual({
    imageUrl,
    icon,
    name,
    className,
}: {
    imageUrl: string | null;
    icon: string | null;
    name: string;
    className?: string;
}) {
    if (imageUrl) {
        return (
            <img
                src={imageUrl}
                alt={name}
                className={cn(
                    'size-16 shrink-0 rounded-2xl object-cover',
                    className,
                )}
            />
        );
    }

    return (
        <span
            aria-hidden="true"
            className={cn(
                'bg-brand-gradient grid size-16 shrink-0 place-items-center rounded-2xl text-3xl shadow-sm',
                className,
            )}
        >
            {icon ?? '🍽️'}
        </span>
    );
}
