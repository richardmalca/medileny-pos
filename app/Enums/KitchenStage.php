<?php

namespace App\Enums;

use App\Models\OrderRound;

enum KitchenStage: int
{
    case New = 0;
    case Received = 1;
    case Preparing = 2;
    case Ready = 3;
    case Handed = 4;

    public static function of(OrderRound $round): self
    {
        return match (true) {
            $round->handed_at !== null => self::Handed,
            $round->ready_at !== null => self::Ready,
            $round->preparing_at !== null => self::Preparing,
            $round->received_at !== null => self::Received,
            default => self::New,
        };
    }

    public function label(): string
    {
        return match ($this) {
            self::New => 'Nuevo',
            self::Received => 'Recibido',
            self::Preparing => 'Preparando',
            self::Ready => 'Listo',
            self::Handed => 'Entregado al mozo',
        };
    }

    public function actionLabel(): string
    {
        return match ($this) {
            self::New => 'Nuevo',
            self::Received => 'Recibido',
            self::Preparing => 'Empezar a preparar',
            self::Ready => 'Marcar listo',
            self::Handed => 'Entregado al mozo',
        };
    }

    public function column(): string
    {
        return match ($this) {
            self::Received => 'received_at',
            self::Preparing => 'preparing_at',
            self::Ready => 'ready_at',
            self::Handed => 'handed_at',
            self::New => throw new \LogicException('El paso Nuevo no tiene columna.'),
        };
    }
}
