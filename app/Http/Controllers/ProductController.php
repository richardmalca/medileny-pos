<?php

namespace App\Http\Controllers;

use App\Http\Requests\Menu\StoreProductRequest;
use App\Http\Requests\Menu\UpdateProductRequest;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Services\MenuService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function __construct(private readonly MenuService $menu) {}

    public function index(): Response
    {
        Gate::authorize('viewAny', Product::class);

        return Inertia::render('menu/index', [
            'categories' => CategoryResource::collection($this->menu->catalog())->resolve(),
        ]);
    }

    public function create(): Response
    {
        Gate::authorize('create', Product::class);

        return Inertia::render('menu/create', [
            'categories' => $this->menu->categoryOptions(),
        ]);
    }

    public function store(StoreProductRequest $request): RedirectResponse
    {
        $product = $this->menu->createProduct($request->validated());

        Inertia::flash('created_id', $product->id);

        return to_route('menu.index');
    }

    public function edit(Product $product): Response
    {
        Gate::authorize('update', $product);

        return Inertia::render('menu/edit', [
            'product' => (new ProductResource($product->load('variants')))->resolve(),
            'categories' => $this->menu->categoryOptions(),
        ]);
    }

    public function update(UpdateProductRequest $request, Product $product): RedirectResponse
    {
        $this->menu->updateProduct($product, $request->validated());

        return to_route('menu.index');
    }

    public function destroy(Product $product): RedirectResponse
    {
        Gate::authorize('delete', $product);

        $this->menu->deleteProduct($product);

        return to_route('menu.index');
    }
}
