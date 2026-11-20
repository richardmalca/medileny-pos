import { useEffect, useState } from 'react';

export function useNow(serverNow: string, intervalMs = 15000): number {
    const [now, setNow] = useState(() => Date.parse(serverNow));

    useEffect(() => {
        const offset = Date.parse(serverNow) - Date.now();
        const tick = () => setNow(Date.now() + offset);

        tick();

        const id = setInterval(tick, intervalMs);

        return () => clearInterval(id);
    }, [serverNow, intervalMs]);

    return now;
}
