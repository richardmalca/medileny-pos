import type { Auth } from '@/types/auth';

declare module 'react' {
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        flashDataType: {
            created_id?: number;
        };
        sharedPageProps: {
            name: string;
            auth: Auth;
            branch: { id: number; name: string } | null;
            [key: string]: unknown;
        };
    }
}
