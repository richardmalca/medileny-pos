import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { OrderDetails, OrderType } from '@/types/orders';

const labels: Record<OrderType, string> = {
    dine_in: 'Mesa',
    takeaway: 'Para llevar',
    delivery: 'Delivery',
};

export function availableTypes(hasTables: boolean): OrderType[] {
    return hasTables ? ['dine_in', 'takeaway'] : ['takeaway', 'delivery'];
}

export function isOrderDetailsValid(details: OrderDetails): boolean {
    if (details.type === 'delivery') {
        return [details.name, details.phone, details.address].every(
            (value) => value.trim() !== '',
        );
    }

    return true;
}

export function OrderDetailsFields({
    details,
    hasTables,
    onChange,
}: {
    details: OrderDetails;
    hasTables: boolean;
    onChange: (next: OrderDetails) => void;
}) {
    const set = (patch: Partial<OrderDetails>) =>
        onChange({ ...details, ...patch });

    return (
        <div className="flex flex-col gap-3">
            <div
                role="radiogroup"
                aria-label="Tipo de pedido"
                className="grid grid-cols-2 gap-2"
            >
                {availableTypes(hasTables).map((type) => (
                    <button
                        key={type}
                        type="button"
                        role="radio"
                        aria-checked={details.type === type}
                        onClick={() => set({ type })}
                        className={cn(
                            'min-h-12 rounded-2xl text-sm font-bold ring-1 ring-border transition-colors duration-150 active:scale-95',
                            details.type === type
                                ? 'bg-primary text-primary-foreground ring-transparent'
                                : 'bg-card',
                        )}
                    >
                        {labels[type]}
                    </button>
                ))}
            </div>

            {details.type === 'takeaway' && hasTables && (
                <p className="text-sm text-muted-foreground">
                    El cliente espera sentado: la mesa queda ocupada hasta
                    entregar el pedido.
                </p>
            )}

            {details.type === 'delivery' && (
                <>
                    <div className="grid gap-2">
                        <Label htmlFor="customer-name">
                            Nombre del cliente
                        </Label>
                        <Input
                            id="customer-name"
                            value={details.name}
                            onChange={(event) =>
                                set({ name: event.target.value })
                            }
                            maxLength={80}
                            className="h-12 rounded-xl"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="customer-phone">Teléfono</Label>
                        <Input
                            id="customer-phone"
                            type="tel"
                            inputMode="tel"
                            value={details.phone}
                            onChange={(event) =>
                                set({ phone: event.target.value })
                            }
                            maxLength={20}
                            className="h-12 rounded-xl"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="delivery-address">Dirección</Label>
                        <Input
                            id="delivery-address"
                            value={details.address}
                            onChange={(event) =>
                                set({ address: event.target.value })
                            }
                            maxLength={255}
                            className="h-12 rounded-xl"
                        />
                    </div>
                </>
            )}
        </div>
    );
}
