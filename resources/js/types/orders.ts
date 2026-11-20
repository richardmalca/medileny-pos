export type OrderType = 'dine_in' | 'takeaway' | 'delivery';

export type CartLine = {
    variantId: number;
    productName: string;
    variantName: string;
    priceCents: number;
    quantity: number;
    note: string;
};

export type OrderDetails = {
    type: OrderType;
    name: string;
    phone: string;
    address: string;
};
