import { useCallback } from 'react';
import { useConfirm } from '@/hooks/use-confirm';
import { notify } from '@/lib/feedback';
import type {
    ConfirmOptions,
    FeedbackMessages,
    UndoRunner,
} from '@/types/feedback';

type Action<R> = {
    confirm: ConfirmOptions;
    messages: FeedbackMessages;
    run: () => Promise<R>;
    undo?: UndoRunner;
    undoFor?: (result: R) => UndoRunner | undefined;
    /** Qué hacer si eligen el botón alternativo del diálogo. */
    alternative?: {
        messages: FeedbackMessages;
        run: () => Promise<R>;
        undo?: UndoRunner;
    };
};

export function useConfirmedAction(): <R = unknown>(
    action: Action<R>,
) => Promise<void> {
    const confirm = useConfirm();

    return useCallback(
        async ({
            confirm: confirmOptions,
            messages,
            run,
            undo,
            undoFor,
            alternative,
        }) => {
            const choice = await confirm(confirmOptions);

            if (!choice) {
                return;
            }

            if (choice === 'alternative' && alternative) {
                notify(
                    alternative.run(),
                    alternative.messages,
                    alternative.undo ? () => alternative.undo! : undefined,
                );

                return;
            }

            notify(run(), messages, undoFor ?? (undo ? () => undo : undefined));
        },
        [confirm],
    );
}
