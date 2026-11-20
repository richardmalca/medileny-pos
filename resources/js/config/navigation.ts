import type { InertiaLinkProps } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import {
    Armchair,
    ChefHat,
    LayoutGrid,
    Settings,
    Store,
    Wallet,
    UtensilsCrossed,
    Users,
} from 'lucide-react';
import { dashboard } from '@/routes';
import { index as cash } from '@/routes/cash';
import { index as floor } from '@/routes/floor';
import { index as kitchen } from '@/routes/kitchen';
import { index as menu } from '@/routes/menu';
import { edit } from '@/routes/profile';
import { index as tables } from '@/routes/tables';
import { index as users } from '@/routes/users';
import type { Permission } from '@/types/auth';

export type NavGroup = 'operation' | 'admin' | 'account';

export const navGroupLabels: Record<NavGroup, string> = {
    operation: 'Operación',
    admin: 'Administración',
    account: 'Cuenta',
};

export type PosNavItem = {
    group: NavGroup;
    title: string;
    icon: LucideIcon;
    href: NonNullable<InertiaLinkProps['href']>;
    permission?: Permission;
};

export const posNav: PosNavItem[] = [
    {
        group: 'operation',
        title: 'Inicio',
        icon: LayoutGrid,
        href: dashboard(),
    },
    {
        group: 'operation',
        title: 'Mesas',
        icon: Armchair,
        href: floor(),
        permission: 'sales.create',
    },
    {
        group: 'operation',
        title: 'Cocina',
        icon: ChefHat,
        href: kitchen(),
        permission: 'kitchen.view',
    },
    {
        group: 'operation',
        title: 'Caja',
        icon: Wallet,
        href: cash(),
        permission: 'cash.open',
    },
    {
        group: 'admin',
        title: 'Carta',
        icon: UtensilsCrossed,
        href: menu(),
        permission: 'menu.manage',
    },
    {
        group: 'admin',
        title: 'Salón',
        icon: Store,
        href: tables(),
        permission: 'tables.manage',
    },
    {
        group: 'admin',
        title: 'Equipo',
        icon: Users,
        href: users(),
        permission: 'users.manage',
    },
    { group: 'account', title: 'Ajustes', icon: Settings, href: edit() },
];
