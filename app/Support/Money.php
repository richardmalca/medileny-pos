<?php

namespace App\Support;

class Money
{
    public static function toCents(mixed $amount): int
    {
        return (int) round(((float) $amount) * 100);
    }

    public static function format(int $cents): string
    {
        return 'S/ '.number_format($cents / 100, 2);
    }
}
