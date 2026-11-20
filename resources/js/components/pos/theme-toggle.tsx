import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppearance } from '@/hooks/use-appearance';

export function ThemeToggle() {
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const isDark = resolvedAppearance === 'dark';

    return (
        <Button
            variant="ghost"
            size="icon"
            className="size-11"
            onClick={() => updateAppearance(isDark ? 'light' : 'dark')}
            aria-label={
                isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'
            }
        >
            {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </Button>
    );
}
