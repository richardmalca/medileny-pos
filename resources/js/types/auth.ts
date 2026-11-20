export type User = {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Permission =
    | 'users.manage'
    | 'sales.create'
    | 'sales.void'
    | 'sales.charge'
    | 'cash.open'
    | 'cash.close'
    | 'kitchen.view'
    | 'reports.view'
    | 'menu.manage'
    | 'inventory.manage'
    | 'tables.manage'
    | 'branch.manage';

export type Auth = {
    user: User;
    permissions: Permission[];
    role: string | null;
};

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
