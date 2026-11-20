import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import type {
    FeedbackMessages,
    RouteTarget,
    UndoRunner,
    VisitResult,
} from '@/types/feedback';

const undoMessages: FeedbackMessages = {
    loading: 'Deshaciendo…',
    success: 'Cambio deshecho',
    error: 'No se pudo deshacer',
};

export function visit(
    target: RouteTarget,
    data: Record<string, unknown> = {},
    options: { preserveState?: boolean } = {},
): Promise<VisitResult> {
    return new Promise((resolve, reject) => {
        const fail = () => reject(new Error('request-failed'));

        router.visit(target.url, {
            method: target.method,
            data: data as Record<string, never>,
            preserveScroll: true,
            preserveState: options.preserveState ?? true,
            onSuccess: (page) => resolve({ createdId: page.flash?.created_id }),
            onError: (errors) =>
                reject(new Error(Object.values(errors)[0] ?? 'request-failed')),
            onCancel: fail,
            onHttpException: () => {
                fail();

                return false;
            },
            onNetworkError: () => {
                fail();

                return false;
            },
        });
    });
}

export function notify<T>(
    promise: Promise<T>,
    messages: FeedbackMessages,
    undoFor?: (result: T) => UndoRunner | undefined,
): void {
    toast.promise(promise, {
        loading: messages.loading,
        success: (result) => {
            const undo = undoFor?.(result);

            return {
                message: messages.success,
                duration: undo ? 8000 : undefined,
                action: undo
                    ? {
                          label: 'Deshacer',
                          onClick: () => notify(undo(), undoMessages),
                      }
                    : undefined,
            };
        },
        error: (reason: unknown) =>
            reason instanceof Error && reason.message !== 'request-failed'
                ? reason.message
                : messages.error,
    });
}
