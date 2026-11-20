import type { Form } from '@inertiajs/react';
import type { ComponentRef } from 'react';
import { useRef } from 'react';
import { useConfirm } from '@/hooks/use-confirm';
import { notify } from '@/lib/feedback';
import type {
    ConfirmOptions,
    FeedbackMessages,
    UndoRunner,
} from '@/types/feedback';

type Submitted = Record<string, unknown>;

type Outcome = { flash: { created_id?: number }; submitted: Submitted };

type Deferred = {
    promise: Promise<Outcome>;
    resolve: (outcome: Outcome) => void;
    reject: (reason: Error) => void;
};

type Options = {
    confirm: ConfirmOptions | ((submitted: Submitted) => ConfirmOptions) | null;
    messages: FeedbackMessages;
    undo?: (outcome: Outcome) => UndoRunner | undefined;
};

function createDeferred(): Deferred {
    let resolve!: Deferred['resolve'];
    let reject!: Deferred['reject'];
    const promise = new Promise<Outcome>((res, rej) => {
        resolve = res;
        reject = rej;
    });

    return { promise, resolve, reject };
}

export function useConfirmedForm({
    confirm: confirmWith,
    messages,
    undo,
}: Options) {
    const confirm = useConfirm();
    const ref = useRef<ComponentRef<typeof Form<Record<string, string>>>>(null);
    const approved = useRef(false);
    const submitted = useRef<Submitted>({});
    const deferred = useRef<Deferred | null>(null);

    const fail = () => deferred.current?.reject(new Error('request-failed'));

    return {
        ref,
        onBefore: () => {
            if (approved.current || confirmWith === null) {
                approved.current = false;

                return true;
            }

            submitted.current = (ref.current?.getData() ?? {}) as Submitted;

            const options =
                typeof confirmWith === 'function'
                    ? confirmWith(submitted.current)
                    : confirmWith;

            void confirm(options).then((accepted) => {
                if (accepted) {
                    approved.current = true;
                    ref.current?.submit();
                }
            });

            return false;
        },
        onStart: () => {
            if (confirmWith === null) {
                submitted.current = (ref.current?.getData() ?? {}) as Submitted;
            }

            deferred.current = createDeferred();
            notify(deferred.current.promise, messages, undo);
        },
        onSuccess: (page: { flash?: { created_id?: number } }) =>
            deferred.current?.resolve({
                flash: page.flash ?? {},
                submitted: submitted.current,
            }),
        onError: fail,
        onCancel: fail,
    };
}
