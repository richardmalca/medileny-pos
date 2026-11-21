import { CircleCheck, TriangleAlert } from 'lucide-react';
import { createContext, useCallback, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { ConfirmChoice, ConfirmOptions } from '@/types/feedback';

type Confirm = (options: ConfirmOptions) => Promise<ConfirmChoice>;

export const ConfirmContext = createContext<Confirm | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
    const [options, setOptions] = useState<ConfirmOptions | null>(null);
    const [open, setOpen] = useState(false);
    const resolver = useRef<((choice: ConfirmChoice) => void) | null>(null);

    const confirm = useCallback<Confirm>(
        (next) =>
            new Promise<ConfirmChoice>((resolve) => {
                resolver.current = resolve;
                setOptions(next);
                setOpen(true);
            }),
        [],
    );

    const settle = (choice: ConfirmChoice) => {
        resolver.current?.(choice);
        resolver.current = null;
        setOpen(false);
    };

    return (
        <ConfirmContext value={confirm}>
            {children}
            <Dialog open={open} onOpenChange={(next) => !next && settle(false)}>
                <DialogContent className="gap-5 rounded-3xl p-6 sm:max-w-md">
                    <DialogHeader className="items-center gap-3 text-center sm:text-center">
                        <span
                            className={
                                options?.destructive
                                    ? 'grid size-14 place-items-center rounded-2xl bg-destructive/15 text-destructive'
                                    : 'bg-brand-gradient grid size-14 place-items-center rounded-2xl text-on-gradient shadow-md'
                            }
                        >
                            {options?.destructive ? (
                                <TriangleAlert className="size-7" />
                            ) : (
                                <CircleCheck className="size-7" />
                            )}
                        </span>
                        <DialogTitle className="display text-2xl leading-tight">
                            {options?.title}
                        </DialogTitle>
                        <DialogDescription className="text-balance">
                            {options?.description}
                        </DialogDescription>
                    </DialogHeader>

                    {(options?.lines?.length || options?.summary) && (
                        <div className="flex flex-col gap-2 rounded-2xl bg-muted/60 p-3 ring-1 ring-border">
                            {options?.lines && options.lines.length > 0 && (
                                <ul className="flex max-h-48 flex-col gap-2 overflow-y-auto">
                                    {options.lines.map((line, index) => (
                                        <li
                                            key={index}
                                            className="flex items-start justify-between gap-3 text-sm"
                                        >
                                            <span className="min-w-0">
                                                <span className="font-bold">
                                                    {line.text}
                                                </span>
                                                {line.detail && (
                                                    <span className="block text-xs text-muted-foreground">
                                                        {line.detail}
                                                    </span>
                                                )}
                                            </span>
                                            {line.amount && (
                                                <span className="shrink-0 tabular-nums">
                                                    {line.amount}
                                                </span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {options?.summary && (
                                <div
                                    className={
                                        options.lines?.length
                                            ? 'mt-1 flex items-baseline justify-between border-t pt-2'
                                            : 'flex items-baseline justify-between'
                                    }
                                >
                                    <span className="font-semibold text-muted-foreground">
                                        {options.summary.label}
                                    </span>
                                    <span className="display text-3xl">
                                        {options.summary.value}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter className="flex-col gap-2 sm:flex-col sm:gap-2">
                        <Button
                            type="button"
                            size="lg"
                            variant={
                                options?.destructive ? 'destructive' : 'default'
                            }
                            className="h-12 w-full rounded-xl text-base font-bold"
                            onClick={() => settle('confirm')}
                            autoFocus
                        >
                            {options?.confirmLabel ?? 'Confirmar'}
                        </Button>
                        {options?.alternativeLabel && (
                            <Button
                                type="button"
                                size="lg"
                                variant="secondary"
                                className="h-12 w-full rounded-xl font-bold"
                                onClick={() => settle('alternative')}
                            >
                                {options.alternativeLabel}
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant="ghost"
                            size="lg"
                            className="h-11 w-full rounded-xl font-semibold text-muted-foreground"
                            onClick={() => settle(false)}
                        >
                            Cancelar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </ConfirmContext>
    );
}
