<?php

use App\Http\Controllers\CashController;
use App\Http\Controllers\CashSessionController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DiningTableController;
use App\Http\Controllers\DiningTableStatusController;
use App\Http\Controllers\FloorController;
use App\Http\Controllers\KitchenController;
use App\Http\Controllers\KitchenStageController;
use App\Http\Controllers\OrderChangeController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\OrderItemController;
use App\Http\Controllers\OrderRoundController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ProductAvailabilityController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ReceiptController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\UserStatusController;
use App\Http\Controllers\ZoneController;
use App\Http\Controllers\ZoneStatusController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/dashboard')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    Route::get('cash', [CashController::class, 'index'])->name('cash.index');
    Route::post('cash/sessions', [CashSessionController::class, 'store'])->name('cash.sessions.store');
    Route::delete('cash/sessions/{session}', [CashSessionController::class, 'destroy'])->name('cash.sessions.destroy');
    Route::patch('cash/sessions/{session}/close', [CashSessionController::class, 'close'])->name('cash.sessions.close');
    Route::patch('cash/sessions/{session}/reopen', [CashSessionController::class, 'reopen'])->name('cash.sessions.reopen');
    Route::get('orders/{order}/checkout', [CheckoutController::class, 'show'])->name('orders.checkout');
    Route::get('orders/{order}/receipt', ReceiptController::class)->name('orders.receipt');
    Route::post('orders/{order}/payments', [PaymentController::class, 'store'])->name('orders.payments.store');
    Route::patch('payments/{payment}/void', [PaymentController::class, 'void'])->name('payments.void');

    Route::get('kitchen', [KitchenController::class, 'index'])->name('kitchen.index');
    Route::patch('rounds/{round}/kitchen', KitchenStageController::class)->name('rounds.kitchen');

    Route::get('floor', [FloorController::class, 'index'])->name('floor.index');

    Route::get('orders/create', [OrderController::class, 'create'])->name('orders.create');
    Route::post('orders', [OrderController::class, 'store'])->name('orders.store');
    Route::get('orders/{order}', [OrderController::class, 'show'])->name('orders.show');
    Route::get('orders/{order}/rounds/create', [OrderRoundController::class, 'create'])->name('orders.rounds.create');
    Route::post('orders/{order}/rounds', [OrderRoundController::class, 'store'])->name('orders.rounds.store');
    Route::patch('orders/{order}/tables', [OrderChangeController::class, 'moveTables'])->name('orders.tables.update');
    Route::patch('orders/{order}/served', [OrderChangeController::class, 'serve'])->name('orders.served');
    Route::patch('orders/{order}/cancel', [OrderChangeController::class, 'cancel'])->name('orders.cancel');
    Route::patch('orders/{order}/restore', [OrderChangeController::class, 'restore'])->name('orders.restore');
    Route::patch('items/{item}/cancel', [OrderItemController::class, 'cancel'])->name('items.cancel');
    Route::patch('items/{item}/restore', [OrderItemController::class, 'restore'])->name('items.restore');
    Route::patch('rounds/{round}/cancel', [OrderRoundController::class, 'cancel'])->name('rounds.cancel');
    Route::patch('rounds/{round}/restore', [OrderRoundController::class, 'restore'])->name('rounds.restore');

    Route::resource('tables', DiningTableController::class)->parameters(['tables' => 'table'])->except(['show']);
    Route::patch('tables/{table}/status', DiningTableStatusController::class)->name('tables.status');
    Route::post('zones', [ZoneController::class, 'store'])->name('zones.store');
    Route::delete('zones/{zone}', [ZoneController::class, 'destroy'])->name('zones.destroy');
    Route::patch('zones/{zone}/status', ZoneStatusController::class)->name('zones.status');

    Route::resource('menu', ProductController::class)->parameters(['menu' => 'product'])->except(['show']);
    Route::patch('menu/{product}/availability', ProductAvailabilityController::class)->name('menu.availability');

    Route::resource('users', UserController::class)->except(['show']);
    Route::patch('users/{user}/status', UserStatusController::class)->name('users.status');
});

require __DIR__.'/settings.php';
