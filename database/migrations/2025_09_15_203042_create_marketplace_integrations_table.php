<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('marketplace_integrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->string('marketplace'); // tokopedia, shopee, lazada, blibli, bukalapak, etc.
            $table->string('store_name');
            $table->string('store_id')->nullable(); // marketplace store ID

            // Credentials (encrypted)
            $table->string('api_key')->nullable();
            $table->string('api_secret')->nullable();
            $table->string('access_token')->nullable();
            $table->string('refresh_token')->nullable();
            $table->datetime('token_expires_at')->nullable();

            // Settings
            $table->json('sync_settings')->nullable(); // what to sync (products, orders, inventory)
            $table->json('mapping_settings')->nullable(); // field mappings
            $table->boolean('auto_sync_products')->default(false);
            $table->boolean('auto_sync_orders')->default(true);
            $table->boolean('auto_sync_inventory')->default(true);

            // Status
            $table->boolean('is_active')->default(false);
            $table->datetime('last_sync_at')->nullable();
            $table->enum('sync_status', ['idle', 'syncing', 'error'])->default('idle');
            $table->text('last_error')->nullable();

            // Sync statistics
            $table->integer('products_synced')->default(0);
            $table->integer('orders_synced')->default(0);
            $table->integer('sync_errors_count')->default(0);

            $table->timestamps();

            // Indexes
            $table->index(['tenant_id', 'marketplace']);
            $table->index(['is_active', 'last_sync_at']);
            $table->unique(['tenant_id', 'marketplace', 'store_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('marketplace_integrations');
    }
};