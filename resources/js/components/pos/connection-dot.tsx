import { useConnectionStatus } from '@laravel/echo-react';
import { realtimeEnabled } from '@/lib/echo';
import { cn } from '@/lib/utils';

const tones: Record<string, string> = {
    connected: 'bg-brand-green',
    connecting: 'bg-brand-yellow',
    reconnecting: 'bg-brand-yellow',
};

const labels: Record<string, string> = {
    connected: 'En vivo',
    connecting: 'Conectando…',
    reconnecting: 'Reconectando…',
};

export function ConnectionDot() {
    return realtimeEnabled ? (
        <LiveDot />
    ) : (
        <span
            role="status"
            title="Sin tiempo real: la pantalla se actualiza sola cada 30 segundos"
            aria-label="Sin tiempo real: la pantalla se actualiza sola cada 30 segundos"
            className="grid size-6 place-items-center"
        >
            <span className="size-2.5 rounded-full bg-muted-foreground/50" />
        </span>
    );
}

function LiveDot() {
    const status = useConnectionStatus();

    return (
        <span
            role="status"
            title={labels[status] ?? 'Sin conexión en vivo'}
            aria-label={labels[status] ?? 'Sin conexión en vivo'}
            className="grid size-6 place-items-center"
        >
            <span
                className={cn(
                    'size-2.5 rounded-full',
                    tones[status] ?? 'bg-destructive',
                )}
            />
        </span>
    );
}
