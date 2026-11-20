<?php

namespace App\Enums;

enum Role: string
{
    case Admin = 'admin';
    case Cashier = 'cashier';
    case Waiter = 'waiter';
    case Kitchen = 'kitchen';

    public function label(): string
    {
        return match ($this) {
            self::Admin => 'Administrador',
            self::Cashier => 'Cajero',
            self::Waiter => 'Mozo',
            self::Kitchen => 'Cocina',
        };
    }

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
