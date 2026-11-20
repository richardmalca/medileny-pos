import { Head } from '@inertiajs/react';
import { ProductForm } from '@/components/menu/product-form';
import { create, index, store } from '@/routes/menu';
import type { CategoryOption } from '@/types/menu';

export default function MenuCreate({
    categories,
}: {
    categories: CategoryOption[];
}) {
    return (
        <>
            <Head title="Nuevo producto" />

            <div className="flex w-full max-w-5xl flex-col gap-4">
                <header>
                    <p className="text-sm font-semibold text-muted-foreground">
                        Carta
                    </p>
                    <h1 className="display text-2xl">Nuevo producto</h1>
                </header>

                <ProductForm
                    form={store.form()}
                    categories={categories}
                    submitLabel="Crear producto"
                />
            </div>
        </>
    );
}

MenuCreate.layout = {
    breadcrumbs: [
        { title: 'Carta', href: index() },
        { title: 'Nuevo', href: create() },
    ],
};
