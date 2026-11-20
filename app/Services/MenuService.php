<?php

namespace App\Services;

use App\Events\FloorChanged;
use App\Models\Branch;
use App\Models\Category;
use App\Models\Product;
use App\Support\Money;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class MenuService
{
    /** @return Collection<int, Category> */
    public function catalog(): Collection
    {
        return Category::query()
            ->with(['products.variants'])
            ->orderBy('sort_order')
            ->get();
    }

    /** @param array<string, mixed> $data */
    public function createProduct(array $data): Product
    {
        return DB::transaction(function () use ($data) {
            $product = Product::create([
                'category_id' => $data['category_id'],
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'is_available' => true,
            ]);

            $this->syncVariants($product, $data['variants']);
            $this->announce();

            return $product;
        });
    }

    /** @param array<string, mixed> $data */
    public function updateProduct(Product $product, array $data): Product
    {
        return DB::transaction(function () use ($product, $data) {
            $product->update([
                'category_id' => $data['category_id'],
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
            ]);

            $this->syncVariants($product, $data['variants']);
            $this->announce();

            return $product;
        });
    }

    public function deleteProduct(Product $product): void
    {
        $product->delete();

        $this->announce();
    }

    public function setAvailable(Product $product, bool $available): Product
    {
        $product->update(['is_available' => $available]);

        $this->announce();

        return $product;
    }

    /** @return array<int, array{id: int, name: string}> */
    public function categoryOptions(): array
    {
        return array_map(
            fn (Category $category) => ['id' => $category->id, 'name' => $category->name],
            Category::query()->orderBy('sort_order')->get(['id', 'name'])->all(),
        );
    }

    private function announce(): void
    {
        Branch::query()->pluck('id')->each(fn (int $branchId) => FloorChanged::dispatch($branchId, 'menu'));
    }

    /** @param array<int, array<string, mixed>> $variants */
    private function syncVariants(Product $product, array $variants): void
    {
        $keptIds = [];

        foreach (array_values($variants) as $position => $variant) {
            $attributes = [
                'name' => $variant['name'],
                'price_cents' => Money::toCents($variant['price']),
                'sort_order' => $position,
            ];

            $model = isset($variant['id'])
                ? $product->variants()->whereKey($variant['id'])->firstOrFail()
                : $product->variants()->make();

            $model->fill($attributes)->save();
            $keptIds[] = $model->id;
        }

        $product->variants()->whereNotIn('id', $keptIds)->delete();
    }
}
