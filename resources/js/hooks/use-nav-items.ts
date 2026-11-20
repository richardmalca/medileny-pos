import { posNav } from '@/config/navigation';
import type { PosNavItem } from '@/config/navigation';
import { useCan } from '@/hooks/use-can';

export function useNavItems(): PosNavItem[] {
    const can = useCan();

    return posNav.filter((item) => !item.permission || can(item.permission));
}
