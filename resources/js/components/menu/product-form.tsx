import { Form, Link } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { useConfirmedForm } from '@/hooks/use-confirmed-form';
import { visit } from '@/lib/feedback';
import { destroy, index, update } from '@/routes/menu';
import type { RouteFormDefinition } from '@/wayfinder';
import type { CategoryOption, Product } from '@/types/menu';

type Row = { key: number; id?: number; name: string; price: string };

type Props = {
    form: RouteFormDefinition<'post'>;
    product?: Product;
    categories: CategoryOption[];
    submitLabel: string;
};

type SubmittedVariant = { id?: string | number };

function restorePayload(product: Product, submitted: Record<string, unknown>) {
    const kept = new Set(
        Object.values(
            (submitted.variants ?? {}) as Record<string, SubmittedVariant>,
        )
            .map((variant) => Number(variant.id))
            .filter((id) => !Number.isNaN(id)),
    );

    return {
        name: product.name,
        description: product.description,
        category_id: product.category_id,
        variants: product.variants.map((variant) => ({
            ...(kept.has(variant.id) ? { id: variant.id } : {}),
            name: variant.name,
            price: (variant.price_cents / 100).toFixed(2),
        })),
    };
}

function initialRows(product?: Product): Row[] {
    if (!product) {
        return [{ key: 0, name: '', price: '' }];
    }

    return product.variants.map((variant) => ({
        key: variant.id,
        id: variant.id,
        name: variant.name,
        price: (variant.price_cents / 100).toFixed(2),
    }));
}

export function ProductForm({ form, product, categories, submitLabel }: Props) {
    const [rows, setRows] = useState<Row[]>(() => initialRows(product));
    const nextKey = useRef(-1);

    const addRow = () =>
        setRows((current) => [
            ...current,
            { key: nextKey.current--, name: '', price: '' },
        ]);

    const removeRow = (key: number) =>
        setRows((current) => current.filter((row) => row.key !== key));

    const confirmed = useConfirmedForm({
        confirm: (data) =>
            product
                ? {
                      title: `¿Guardar los cambios de ${product.name}?`,
                      description: 'Los precios se actualizarán en la carta.',
                      confirmLabel: 'Guardar',
                  }
                : {
                      title: `¿Crear ${String(data.name)}?`,
                      description: 'Se agregará a la carta.',
                      confirmLabel: 'Crear producto',
                  },
        messages: product
            ? {
                  loading: 'Guardando cambios…',
                  success: 'Cambios guardados',
                  error: 'No se pudieron guardar los cambios',
              }
            : {
                  loading: 'Creando producto…',
                  success: 'Producto creado',
                  error: 'No se pudo crear el producto',
              },
        undo: ({ flash, submitted }) => {
            if (product) {
                return () =>
                    visit(
                        update(product.id),
                        restorePayload(product, submitted),
                    );
            }

            const createdId = flash.created_id;

            return createdId === undefined
                ? undefined
                : () => visit(destroy(createdId));
        },
    });

    return (
        <Form
            {...form}
            {...confirmed}
            className="grid gap-4 lg:grid-cols-2 lg:items-start"
        >
            {({ processing, errors }) => (
                <>
                    <div className="flex flex-col gap-5 rounded-2xl bg-card p-5 ring-1 ring-border">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nombre</Label>
                            <Input
                                id="name"
                                name="name"
                                defaultValue={product?.name}
                                required
                                autoComplete="off"
                                placeholder="Ej. Pollo a la brasa"
                                className="h-12 rounded-xl"
                            />
                            <InputError message={errors.name} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Descripción</Label>
                            <Input
                                id="description"
                                name="description"
                                defaultValue={product?.description ?? ''}
                                autoComplete="off"
                                placeholder="Ej. Con papas fritas y ensalada"
                                className="h-12 rounded-xl"
                            />
                            <InputError message={errors.description} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="category_id">Categoría</Label>
                            <Select
                                name="category_id"
                                defaultValue={
                                    product
                                        ? String(product.category_id)
                                        : undefined
                                }
                                required
                            >
                                <SelectTrigger
                                    id="category_id"
                                    className="h-12 w-full rounded-xl"
                                >
                                    <SelectValue placeholder="Elige una categoría" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((category) => (
                                        <SelectItem
                                            key={category.id}
                                            value={String(category.id)}
                                        >
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.category_id} />
                        </div>
                    </div>

                    <fieldset className="flex flex-col gap-3 rounded-2xl bg-card p-5 ring-1 ring-border">
                        <legend className="sr-only">
                            Presentaciones y precios
                        </legend>
                        <p aria-hidden="true" className="text-sm font-semibold">
                            Presentaciones y precios
                        </p>

                        {rows.map((row, position) => (
                            <div
                                key={row.key}
                                className="flex flex-col gap-2 rounded-2xl bg-muted/40 p-3"
                            >
                                {row.id !== undefined && (
                                    <input
                                        type="hidden"
                                        name={`variants[${position}][id]`}
                                        value={row.id}
                                    />
                                )}
                                <div className="flex items-start gap-2">
                                    <div className="grid flex-1 gap-1">
                                        <Input
                                            name={`variants[${position}][name]`}
                                            defaultValue={row.name}
                                            required
                                            aria-label="Nombre de la presentación"
                                            placeholder="Ej. 1/4 de pollo"
                                            className="h-12 rounded-xl"
                                        />
                                        <InputError
                                            message={
                                                errors[
                                                    `variants.${position}.name`
                                                ]
                                            }
                                        />
                                    </div>
                                    <div className="grid w-32 gap-1">
                                        <div className="relative">
                                            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                                                S/
                                            </span>
                                            <Input
                                                name={`variants[${position}][price]`}
                                                defaultValue={row.price}
                                                required
                                                type="number"
                                                inputMode="decimal"
                                                step="0.01"
                                                min="0.1"
                                                aria-label="Precio en soles"
                                                placeholder="0.00"
                                                className="h-12 rounded-xl pl-9"
                                            />
                                        </div>
                                        <InputError
                                            message={
                                                errors[
                                                    `variants.${position}.price`
                                                ]
                                            }
                                        />
                                    </div>
                                    {rows.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="size-12 shrink-0 rounded-xl text-destructive"
                                            aria-label="Quitar presentación"
                                            onClick={() => removeRow(row.key)}
                                        >
                                            <Trash2 className="size-5" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}

                        <InputError message={errors.variants} />

                        <Button
                            type="button"
                            variant="outline"
                            className="h-12 gap-2 rounded-xl"
                            onClick={addRow}
                        >
                            <Plus className="size-5" />
                            Agregar presentación
                        </Button>
                    </fieldset>

                    <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end lg:col-span-2">
                        <Button
                            asChild
                            variant="outline"
                            size="lg"
                            className="h-12 rounded-xl"
                        >
                            <Link href={index()}>Cancelar</Link>
                        </Button>
                        <Button
                            size="lg"
                            disabled={processing}
                            className="h-12 rounded-xl font-bold"
                        >
                            {processing && <Spinner />}
                            {submitLabel}
                        </Button>
                    </div>
                </>
            )}
        </Form>
    );
}
