import { useSyncExternalStore } from 'react';
import {
    isAudioReady,
    isSoundEnabled,
    setSoundEnabled,
    subscribeSound,
    unlockAudio,
} from '@/lib/sound';

export function useSound() {
    const enabled = useSyncExternalStore(
        subscribeSound,
        isSoundEnabled,
        () => true,
    );
    const ready = useSyncExternalStore(
        subscribeSound,
        isAudioReady,
        () => false,
    );

    return {
        enabled,
        ready,
        toggle: async () => {
            setSoundEnabled(!enabled);

            if (!enabled) {
                await unlockAudio();
            }
        },
    };
}
