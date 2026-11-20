import { usePage } from '@inertiajs/react';
import type { Permission } from '@/types/auth';

export function useCan(): (permission: Permission) => boolean {
    const { auth } = usePage().props;

    return (permission) => auth.permissions.includes(permission);
}
