<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Services\MenuService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ProductAvailabilityController extends Controller
{
    public function __invoke(Request $request, Product $product, MenuService $menu): RedirectResponse
    {
        Gate::authorize('update', $product);

        $menu->setAvailable($product, $request->boolean('is_available'));

        return back();
    }
}
