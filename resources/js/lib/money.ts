const formatter = new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
});

export function toCents(value: string): number {
    const parsed = Number.parseFloat(value.replace(',', '.'));

    return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
}

export function toDecimal(cents: number): string {
    return (cents / 100).toFixed(2);
}

export function formatMoney(cents: number): string {
    return formatter.format(cents / 100);
}
