import { Head } from '@inertiajs/react';
import { ProductForm } from '@/components/menu/product-form';
import { index, update } from '@/routes/menu';
import type { CategoryOption, Product } from '@/types/menu';

export default function MenuEdit({
    product,
    categories,
}: {
    product: Product;
    categories: CategoryOption[];
}) {
    return (
        <>
            <Head title={product.name} />

            <div className="flex w-full max-w-5xl flex-col gap-4">
                <header>
                    <p className="text-sm font-semibold text-muted-foreground">
                        Carta
                    </p>
                    <h1 className="display text-2xl">{product.name}</h1>
                </header>

                <ProductForm
                    form={update.form(product.id)}
                    product={product}
                    categories={categories}
                    submitLabel="Guardar cambios"
                />
            </div>
        </>
    );
}

MenuEdit.layout = {
    breadcrumbs: [
        { title: 'Carta', href: index() },
        { title: 'Editar', href: index() },
    ],
};
