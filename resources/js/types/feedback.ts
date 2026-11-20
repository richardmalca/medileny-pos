export type ConfirmOptions = {
    title: string;
    description?: string;
    confirmLabel?: string;
    destructive?: boolean;
    /** Segundo botón de confirmación que resuelve un paso más en un solo clic. */
    alternativeLabel?: string;
    /** Detalle de lo que se va a hacer (platos, montos…). */
    lines?: ConfirmLine[];
    /** Cifra destacada al pie del detalle (por ejemplo el total). */
    summary?: { label: string; value: string };
};

export type ConfirmLine = { text: string; detail?: string; amount?: string };

export type ConfirmChoice = false | 'confirm' | 'alternative';

export type FeedbackMessages = {
    loading: string;
    success: string;
    error: string;
};

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

export type RouteTarget = { url: string; method: HttpMethod };

export type UndoRunner = () => Promise<unknown>;

export type VisitResult = { createdId?: number };
