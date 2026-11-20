import { configureEcho } from '@laravel/echo-react';

const env = import.meta.env;
const secure = (env.VITE_REVERB_SCHEME ?? 'http') === 'https';
const port = Number(env.VITE_REVERB_PORT ?? (secure ? 443 : 8080));

/**
 * El tiempo real solo se activa si hay un servidor de WebSockets configurado
 * (desarrollo, o VITE_REVERB_APP_KEY en producción). Sin él la app sigue
 * funcionando y se actualiza sola cada pocos segundos.
 */
export const realtimeEnabled: boolean =
    env.DEV || Boolean(env.VITE_REVERB_APP_KEY);

export function setupEcho(): void {
    if (!realtimeEnabled) {
        return;
    }

    configureEcho({
        broadcaster: 'reverb',
        key: env.VITE_REVERB_APP_KEY ?? 'medileny-local-key',
        wsHost: env.VITE_REVERB_HOST ?? window.location.hostname,
        wsPort: port,
        wssPort: port,
        forceTLS: secure,
        enabledTransports: ['ws', 'wss'],
    });
}
