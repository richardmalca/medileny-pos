import { Head } from '@inertiajs/react';
import { Bell, ChefHat, TriangleAlert, Volume2, VolumeX } from 'lucide-react';
import AppearanceTabs from '@/components/appearance-tabs';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { useSound } from '@/hooks/use-sound';
import { playTone } from '@/lib/sound';
import type { Tone } from '@/lib/sound';
import { cn } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';

const tones: { tone: Tone; label: string; hint: string; icon: typeof Bell }[] =
    [
        {
            tone: 'new-order',
            label: 'Pedido nuevo',
            hint: 'Suena en cocina cuando llega una tanda',
            icon: ChefHat,
        },
        {
            tone: 'ready',
            label: 'Pedido listo',
            hint: 'Suena al mozo cuando cocina termina',
            icon: Bell,
        },
        {
            tone: 'alert',
            label: 'Alerta',
            hint: 'Cuando un pedido se demora de más',
            icon: TriangleAlert,
        },
    ];

export default function Appearance() {
    const { enabled, ready, toggle } = useSound();

    return (
        <>
            <Head title="Apariencia y avisos" />

            <h1 className="sr-only">Apariencia y avisos</h1>

            <div className="grid items-start gap-4 lg:grid-cols-2">
                <section className="space-y-6 rounded-2xl bg-card p-5 ring-1 ring-border">
                    <Heading
                        variant="small"
                        title="Apariencia"
                        description="Elige cómo se ve el sistema en este equipo"
                    />
                    <AppearanceTabs />
                </section>

                <section className="space-y-5 rounded-2xl bg-card p-5 ring-1 ring-border">
                    <Heading
                        variant="small"
                        title="Avisos sonoros"
                        description="Se guardan solo en este equipo"
                    />

                    <button
                        type="button"
                        role="switch"
                        aria-checked={enabled}
                        onClick={() => void toggle()}
                        className={cn(
                            'flex w-full items-center justify-between gap-3 rounded-2xl p-4 text-left ring-1 transition-colors duration-150',
                            enabled
                                ? 'bg-brand-green/10 ring-brand-green/40'
                                : 'bg-muted/50 ring-border',
                        )}
                    >
                        <span className="flex items-center gap-3">
                            <span
                                className={cn(
                                    'grid size-10 place-items-center rounded-xl',
                                    enabled
                                        ? 'bg-brand-green text-on-green'
                                        : 'bg-card ring-1 ring-border',
                                )}
                            >
                                {enabled ? (
                                    <Volume2 className="size-5" />
                                ) : (
                                    <VolumeX className="size-5" />
                                )}
                            </span>
                            <span>
                                <span className="block font-bold">
                                    {enabled
                                        ? 'Sonido activado'
                                        : 'Sonido desactivado'}
                                </span>
                                <span className="block text-xs text-muted-foreground">
                                    {enabled && !ready
                                        ? 'Toca la pantalla una vez para habilitarlo'
                                        : 'Avisos de pedidos nuevos, listos y alertas'}
                                </span>
                            </span>
                        </span>
                    </button>

                    <ul className="flex flex-col gap-2">
                        {tones.map(({ tone, label, hint, icon: Icon }) => (
                            <li
                                key={tone}
                                className="flex items-center gap-3 rounded-xl bg-muted/40 p-3"
                            >
                                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-card ring-1 ring-border">
                                    <Icon className="size-4" />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-sm font-bold">
                                        {label}
                                    </span>
                                    <span className="block truncate text-xs text-muted-foreground">
                                        {hint}
                                    </span>
                                </span>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-9 rounded-full px-4 font-bold"
                                    disabled={!enabled}
                                    onClick={() => playTone(tone)}
                                >
                                    Probar
                                </Button>
                            </li>
                        ))}
                    </ul>
                </section>
            </div>
        </>
    );
}

Appearance.layout = {
    breadcrumbs: [
        {
            title: 'Apariencia y avisos',
            href: editAppearance(),
        },
    ],
};
