export type Tone = 'new-order' | 'ready' | 'alert';

type AudioWindow = Window &
    typeof globalThis & { webkitAudioContext?: typeof AudioContext };

const STORAGE_KEY = 'medileny-sound';
const listeners = new Set<() => void>();
let context: AudioContext | null = null;

function notify(): void {
    listeners.forEach((listener) => listener());
}

function audioContext(): AudioContext | null {
    if (context) {
        return context;
    }

    const Constructor =
        (window as AudioWindow).AudioContext ??
        (window as AudioWindow).webkitAudioContext;

    if (!Constructor) {
        return null;
    }

    context = new Constructor();
    context.onstatechange = notify;

    return context;
}

export function subscribeSound(listener: () => void): () => void {
    listeners.add(listener);

    return () => listeners.delete(listener);
}

export function isSoundEnabled(): boolean {
    try {
        return localStorage.getItem(STORAGE_KEY) !== 'off';
    } catch {
        return true;
    }
}

export function isAudioReady(): boolean {
    return context?.state === 'running';
}

export function setSoundEnabled(enabled: boolean): void {
    try {
        localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off');
    } catch {
        return;
    } finally {
        notify();
    }
}

export async function unlockAudio(): Promise<void> {
    const current = audioContext();

    if (current && current.state === 'suspended') {
        await current.resume();
    }
}

function beep(
    current: AudioContext,
    frequency: number,
    offset: number,
    duration: number,
    type: OscillatorType,
): void {
    const start = current.currentTime + offset;
    const oscillator = current.createOscillator();
    const gain = current.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.35, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    oscillator.connect(gain).connect(current.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.05);
}

const patterns: Record<
    Tone,
    {
        notes: [number, number, number][];
        type: OscillatorType;
        vibrate: number[];
    }
> = {
    'new-order': {
        notes: [
            [880, 0, 0.22],
            [660, 0.25, 0.22],
            [880, 0.6, 0.22],
            [660, 0.85, 0.3],
        ],
        type: 'triangle',
        vibrate: [200, 100, 200],
    },
    ready: {
        notes: [
            [523, 0, 0.18],
            [659, 0.2, 0.18],
            [784, 0.4, 0.35],
        ],
        type: 'sine',
        vibrate: [120, 60, 120],
    },
    alert: {
        notes: [
            [330, 0, 0.3],
            [247, 0.32, 0.45],
        ],
        type: 'square',
        vibrate: [400],
    },
};

export function playTone(tone: Tone): void {
    if (!isSoundEnabled()) {
        return;
    }

    const current = audioContext();

    if (current && current.state === 'running') {
        const pattern = patterns[tone];

        pattern.notes.forEach(([frequency, offset, duration]) =>
            beep(current, frequency, offset, duration, pattern.type),
        );
    }

    navigator.vibrate?.(patterns[tone].vibrate);
}
