export type Member = {
    id: number;
    name: string;
    email: string;
    role: string | null;
    role_label: string | null;
    branch_id: number | null;
    branch_name: string | null;
    is_active: boolean;
};

export type RoleOption = { value: string; label: string };

export type BranchOption = { id: number; name: string };
