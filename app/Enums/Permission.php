<?php

namespace App\Enums;

enum Permission: string
{
    case ManageUsers = 'users.manage';
    case CreateSales = 'sales.create';
    case VoidSales = 'sales.void';
    case ChargeSales = 'sales.charge';
    case OpenCash = 'cash.open';
    case CloseCash = 'cash.close';
    case ViewKitchen = 'kitchen.view';
    case ViewReports = 'reports.view';
    case ManageMenu = 'menu.manage';
    case ManageInventory = 'inventory.manage';
    case ManageTables = 'tables.manage';
    case ManageBranch = 'branch.manage';

    public function label(): string
    {
        return match ($this) {
            self::ManageUsers => 'Gestionar el equipo',
            self::CreateSales => 'Registrar ventas',
            self::VoidSales => 'Anular ventas',
            self::ChargeSales => 'Cobrar cuentas',
            self::OpenCash => 'Abrir caja',
            self::CloseCash => 'Cerrar caja',
            self::ViewKitchen => 'Ver la cocina',
            self::ViewReports => 'Ver reportes',
            self::ManageMenu => 'Gestionar la carta',
            self::ManageInventory => 'Gestionar el inventario',
            self::ManageTables => 'Gestionar mesas y zonas',
            self::ManageBranch => 'Configurar la sucursal',
        };
    }

    /** @return list<self> */
    public static function forRole(Role $role): array
    {
        return match ($role) {
            Role::Admin => self::cases(),
            Role::Cashier => [self::CreateSales, self::ChargeSales, self::OpenCash, self::CloseCash],
            Role::Waiter => [self::CreateSales],
            Role::Kitchen => [self::ViewKitchen],
        };
    }

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
