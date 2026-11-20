import type { Thresholds } from '@/types/floor';

export type Urgency = 'ok' | 'warn' | 'alert';

export function minutesSince(iso: string, nowMs: number): number {
    return Math.max(0, Math.floor((nowMs - Date.parse(iso)) / 60000));
}

export function formatMinutes(minutes: number): string {
    if (minutes < 60) {
        return `${minutes} min`;
    }

    return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')} min`;
}

export function urgencyOf(minutes: number, thresholds: Thresholds): Urgency {
    if (minutes >= thresholds.alert) {
        return 'alert';
    }

    return minutes >= thresholds.warn ? 'warn' : 'ok';
}

export function formatDateTime(iso: string): string {
    return new Date(iso).toLocaleString('es-PE', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function formatClock(iso: string): string {
    return new Date(iso).toLocaleTimeString('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
    });
}
