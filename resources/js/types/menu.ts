export type ProductVariant = {
    id: number;
    name: string;
    price_cents: number;
};

export type Product = {
    id: number;
    name: string;
    description: string | null;
    category_id: number;
    image_url: string | null;
    is_available: boolean;
    variants: ProductVariant[];
};

export type Category = {
    id: number;
    name: string;
    icon: string | null;
    products: Product[];
};

export type CategoryOption = { id: number; name: string };
