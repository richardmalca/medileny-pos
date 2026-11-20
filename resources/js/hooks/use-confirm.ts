import { useContext } from 'react';
import { ConfirmContext } from '@/components/confirm-provider';
import type { ConfirmChoice, ConfirmOptions } from '@/types/feedback';

export function useConfirm(): (
    options: ConfirmOptions,
) => Promise<ConfirmChoice> {
    const confirm = useContext(ConfirmContext);

    if (!confirm) {
        throw new Error('useConfirm requiere un ConfirmProvider');
    }

    return confirm;
}
