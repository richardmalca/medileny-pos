<?php

use App\Enums\Role;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use Database\Seeders\RoleSeeder;

beforeEach(function () {
    $this->seed(RoleSeeder::class);
    $this->admin = User::factory()->create()->assignRole(Role::Admin->value);
    $this->category = Category::factory()->create();
});

function productData(Category $category, array $overrides = []): array
{
    return [
        'name' => 'Pollo a la brasa',
        'description' => 'Con papas y ensalada',
        'category_id' => $category->id,
        'variants' => [
            ['name' => '1/4 de pollo', 'price' => '18'],
            ['name' => '1/2 pollo', 'price' => '33.50'],
        ],
        ...$overrides,
    ];
}

it('lists the menu grouped by category for an admin', function () {
    Product::factory()->for($this->category)->has(ProductVariant::factory(), 'variants')->create();

    $this->actingAs($this->admin)
        ->get(route('menu.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('menu/index')
            ->has('categories', 1)
            ->has('categories.0.products', 1)
            ->has('categories.0.products.0.variants', 1));
});

it('forbids the menu screens to users without permission', function (Role $role) {
    $user = User::factory()->create()->assignRole($role->value);
    $product = Product::factory()->for($this->category)->create();

    $this->actingAs($user)->get(route('menu.index'))->assertForbidden();
    $this->actingAs($user)->get(route('menu.create'))->assertForbidden();
    $this->actingAs($user)->post(route('menu.store'), productData($this->category))->assertForbidden();
    $this->actingAs($user)->patch(route('menu.availability', $product), ['is_available' => false])->assertForbidden();
})->with([Role::Cashier, Role::Waiter, Role::Kitchen]);

it('creates a product with its variants priced in cents', function () {
    $this->actingAs($this->admin)
        ->post(route('menu.store'), productData($this->category))
        ->assertRedirect(route('menu.index'));

    $product = Product::where('name', 'Pollo a la brasa')->firstOrFail();

    expect($product->is_available)->toBeTrue()
        ->and($product->variants->pluck('price_cents')->all())->toBe([1800, 3350])
        ->and($product->variants->pluck('name')->all())->toBe(['1/4 de pollo', '1/2 pollo']);
});

it('requires at least one variant with a valid price', function () {
    $this->actingAs($this->admin)
        ->post(route('menu.store'), productData($this->category, ['variants' => []]))
        ->assertSessionHasErrors('variants');

    $this->actingAs($this->admin)
        ->post(route('menu.store'), productData($this->category, ['variants' => [['name' => 'X', 'price' => 'abc']]]))
        ->assertSessionHasErrors('variants.0.price');
});

it('updates, adds and removes variants', function () {
    $product = Product::factory()->for($this->category)->create();
    $keep = ProductVariant::factory()->for($product)->create(['name' => 'Personal', 'price_cents' => 800]);
    $remove = ProductVariant::factory()->for($product)->create(['name' => 'Familiar']);

    $this->actingAs($this->admin)
        ->put(route('menu.update', $product), productData($this->category, [
            'name' => 'Papas fritas',
            'variants' => [
                ['id' => $keep->id, 'name' => 'Personal', 'price' => '9.00'],
                ['name' => 'Jumbo', 'price' => '20'],
            ],
        ]))
        ->assertRedirect(route('menu.index'));

    $product->refresh()->load('variants');

    expect($product->name)->toBe('Papas fritas')
        ->and($product->variants->pluck('name')->all())->toBe(['Personal', 'Jumbo'])
        ->and($keep->refresh()->price_cents)->toBe(900)
        ->and(ProductVariant::find($remove->id))->toBeNull();
});

it('rejects variants that belong to another product', function () {
    $product = Product::factory()->for($this->category)->create();
    $foreign = ProductVariant::factory()->create();

    $this->actingAs($this->admin)
        ->put(route('menu.update', $product), productData($this->category, [
            'variants' => [['id' => $foreign->id, 'name' => 'X', 'price' => '5']],
        ]))
        ->assertSessionHasErrors('variants.0.id');
});

it('marks a product as sold out and available again', function () {
    $product = Product::factory()->for($this->category)->create();

    $this->actingAs($this->admin)->patch(route('menu.availability', $product), ['is_available' => false]);
    expect($product->refresh()->is_available)->toBeFalse();

    $this->actingAs($this->admin)->patch(route('menu.availability', $product), ['is_available' => true]);
    expect($product->refresh()->is_available)->toBeTrue();
});

it('flashes the id of the created product so the creation can be undone', function () {
    $this->actingAs($this->admin)
        ->post(route('menu.store'), productData($this->category))
        ->assertInertiaFlash('created_id', Product::where('name', 'Pollo a la brasa')->value('id'));
});

it('deletes a product together with its variants', function () {
    $product = Product::factory()->for($this->category)->has(ProductVariant::factory(), 'variants')->create();

    $this->actingAs($this->admin)
        ->delete(route('menu.destroy', $product))
        ->assertRedirect(route('menu.index'));

    expect(Product::find($product->id))->toBeNull()
        ->and(ProductVariant::where('product_id', $product->id)->count())->toBe(0);
});

it('forbids deleting a product without permission', function () {
    $user = User::factory()->create()->assignRole(Role::Waiter->value);
    $product = Product::factory()->for($this->category)->create();

    $this->actingAs($user)->delete(route('menu.destroy', $product))->assertForbidden();
});
