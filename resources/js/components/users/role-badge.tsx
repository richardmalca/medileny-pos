import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const styles: Record<string, string> = {
    admin: 'bg-primary/15 text-primary',
    cashier: 'bg-brand-yellow text-on-pastel',
    waiter: 'bg-brand-green/20 text-brand-green',
    kitchen: 'bg-secondary text-secondary-foreground',
};

export function RoleBadge({
    role,
    label,
}: {
    role: string | null;
    label: string | null;
}) {
    return (
        <Badge
            className={cn(
                'rounded-full border-transparent px-2.5 py-1 text-xs font-bold',
                role ? styles[role] : 'bg-muted text-muted-foreground',
            )}
        >
            {label ?? 'Sin rol'}
        </Badge>
    );
}
