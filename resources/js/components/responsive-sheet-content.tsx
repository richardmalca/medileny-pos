import type { ComponentProps } from 'react';
import { SheetContent } from '@/components/ui/sheet';
import { useMediaQuery } from '@/hooks/use-media-query';
import { cn } from '@/lib/utils';

export function ResponsiveSheetContent({
    className,
    ...props
}: Omit<ComponentProps<typeof SheetContent>, 'side'>) {
    const desktop = useMediaQuery('(min-width: 768px)');

    return (
        <SheetContent
            side={desktop ? 'right' : 'bottom'}
            className={cn(
                'overflow-y-auto',
                desktop
                    ? 'w-full gap-4 sm:max-w-md'
                    : 'max-h-[92svh] rounded-t-3xl',
                className,
            )}
            {...props}
        />
    );
}
