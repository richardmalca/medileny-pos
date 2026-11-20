import { Link, router } from '@inertiajs/react';
import { LogOut, Settings } from 'lucide-react';
import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useConfirmedAction } from '@/hooks/use-confirmed-action';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { visit } from '@/lib/feedback';
import { logout } from '@/routes';
import { edit } from '@/routes/profile';
import type { User } from '@/types';

type Props = {
    user: User;
};

export function UserMenuContent({ user }: Props) {
    const cleanup = useMobileNavigation();

    const run = useConfirmedAction();

    const handleLogout = () => {
        cleanup();

        return run({
            confirm: {
                title: '¿Cerrar sesión?',
                description:
                    'Tendrás que volver a ingresar tu correo y contraseña.',
                confirmLabel: 'Cerrar sesión',
            },
            messages: {
                loading: 'Cerrando sesión…',
                success: 'Sesión cerrada',
                error: 'No se pudo cerrar la sesión',
            },
            run: () => {
                router.flushAll();

                return visit(logout());
            },
        });
    };

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <UserInfo user={user} showEmail={true} />
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                    <Link
                        className="block w-full cursor-pointer"
                        href={edit()}
                        prefetch
                        onClick={cleanup}
                    >
                        <Settings className="mr-2" />
                        Ajustes
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
                className="cursor-pointer"
                onSelect={handleLogout}
                data-test="logout-button"
            >
                <LogOut className="mr-2" />
                Cerrar sesión
            </DropdownMenuItem>
        </>
    );
}
