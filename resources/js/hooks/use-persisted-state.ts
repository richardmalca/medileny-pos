import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

function read<T>(key: string, fallback: T): T {
    try {
        const raw = window.sessionStorage.getItem(key);

        return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
        return fallback;
    }
}

/**
 * Como useState, pero el valor sobrevive a recargar la página (sessionStorage).
 * Si el navegador no deja guardar, funciona igual en memoria.
 */
export function usePersistedState<T>(
    key: string,
    initial: T,
): [T, Dispatch<SetStateAction<T>>] {
    const [value, setValue] = useState<T>(() => read(key, initial));

    useEffect(() => {
        try {
            window.sessionStorage.setItem(key, JSON.stringify(value));
        } catch {
            // sin almacenamiento: se queda en memoria
        }
    }, [key, value]);

    return [value, setValue];
}
