<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case Cash = 'cash';
    case Yape = 'yape';
    case Plin = 'plin';
    case Card = 'card';

    public function label(): string
    {
        return match ($this) {
            self::Cash => 'Efectivo',
            self::Yape => 'Yape',
            self::Plin => 'Plin',
            self::Card => 'Tarjeta',
        };
    }
}
