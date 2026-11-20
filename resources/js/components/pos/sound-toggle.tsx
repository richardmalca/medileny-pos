import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSound } from '@/hooks/use-sound';
import { playTone } from '@/lib/sound';

export function SoundToggle() {
    const { enabled, ready, toggle } = useSound();
    const waiting = enabled && !ready;

    const change = async () => {
        await toggle();

        if (!enabled) {
            playTone('ready');
        }
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            className="relative size-11"
            onClick={change}
            aria-label={
                enabled
                    ? waiting
                        ? 'Sonido activado: toca la pantalla para habilitarlo'
                        : 'Desactivar el sonido de avisos'
                    : 'Activar el sonido de avisos'
            }
        >
            {enabled ? (
                <Volume2 className="size-5" />
            ) : (
                <VolumeX className="size-5" />
            )}
            {waiting && (
                <span className="absolute top-2 right-2 size-2.5 rounded-full bg-brand-yellow ring-2 ring-background" />
            )}
        </Button>
    );
}
