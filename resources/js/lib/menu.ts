import { formatMoney } from '@/lib/money';
import type { Product } from '@/types/menu';

export function priceLabel(product: Product): string {
    const prices = product.variants.map((variant) => variant.price_cents);
    const lowest = Math.min(...prices);

    return prices.length > 1
        ? `Desde ${formatMoney(lowest)}`
        : formatMoney(lowest);
}
