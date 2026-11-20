import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function QuantityStepper({
    value,
    onChange,
    label,
    compact = false,
}: {
    value: number;
    onChange: (next: number) => void;
    label: string;
    compact?: boolean;
}) {
    return (
        <div className="flex items-center gap-2">
            <Button
                type="button"
                variant="outline"
                size="icon"
                className={
                    compact ? 'size-8 rounded-full' : 'size-11 rounded-full'
                }
                aria-label={`Quitar uno de ${label}`}
                disabled={value <= 0}
                onClick={() => onChange(value - 1)}
            >
                <Minus className="size-5" />
            </Button>
            <span
                aria-live="polite"
                className={
                    compact
                        ? 'display w-6 text-center text-lg tabular-nums'
                        : 'display w-8 text-center text-2xl tabular-nums'
                }
            >
                {value}
            </span>
            <Button
                type="button"
                size="icon"
                className={
                    compact ? 'size-8 rounded-full' : 'size-11 rounded-full'
                }
                aria-label={`Agregar uno de ${label}`}
                onClick={() => onChange(value + 1)}
            >
                <Plus className="size-5" />
            </Button>
        </div>
    );
}
