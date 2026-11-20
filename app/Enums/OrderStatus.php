<?php

namespace App\Enums;

enum OrderStatus: string
{
    case Open = 'open';
    case Paid = 'paid';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::Open => 'Abierta',
            self::Paid => 'Pagada',
            self::Cancelled => 'Anulada',
        };
    }
}
