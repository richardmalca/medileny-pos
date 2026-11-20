<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained()->restrictOnDelete();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->unsignedInteger('number');
            $table->string('type', 20);
            $table->string('status', 20);
            $table->string('customer_name', 80)->nullable();
            $table->string('customer_phone', 20)->nullable();
            $table->string('delivery_address')->nullable();
            $table->unsignedInteger('total_cents')->default(0);
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->index(['branch_id', 'created_at']);
            $table->index(['branch_id', 'status']);
        });

        Schema::create('order_table', function (Blueprint $table) {
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('dining_table_id')->constrained()->restrictOnDelete();

            $table->primary(['order_id', 'dining_table_id']);
        });

        Schema::create('order_rounds', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->uuid('client_id')->unique();
            $table->timestamp('sent_at');
            $table->timestamp('received_at')->nullable();
            $table->timestamp('preparing_at')->nullable();
            $table->timestamp('ready_at')->nullable();
            $table->timestamp('handed_at')->nullable();
            $table->foreignId('kitchen_user_id')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('order_round_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_variant_id')->constrained()->restrictOnDelete();
            $table->string('product_name');
            $table->string('variant_name', 60);
            $table->unsignedInteger('unit_price_cents');
            $table->unsignedSmallInteger('quantity');
            $table->string('note', 120)->nullable();
            $table->boolean('needs_kitchen')->default(true);
            $table->timestamp('served_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('order_rounds');
        Schema::dropIfExists('order_table');
        Schema::dropIfExists('orders');
    }
};
