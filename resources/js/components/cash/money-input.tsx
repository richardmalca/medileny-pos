import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function MoneyInput({
    id,
    value,
    onChange,
    label,
    className,
    autoFocus,
}: {
    id: string;
    value: string;
    onChange: (next: string) => void;
    label: string;
    className?: string;
    autoFocus?: boolean;
}) {
    return (
        <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 font-semibold text-muted-foreground">
                S/
            </span>
            <Input
                id={id}
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                aria-label={label}
                autoFocus={autoFocus}
                placeholder="0.00"
                className={cn(
                    'h-14 rounded-xl pl-11 text-xl font-bold',
                    className,
                )}
            />
        </div>
    );
}
