<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add service fields to sales table
        Schema::table('sales', function (Blueprint $table) {
            $table->string('type')->default('product')->after('grand_total'); // product or service
            $table->integer('estimated_duration')->nullable()->after('type'); // in minutes
        });

        // Add service_id to sale_items table
        Schema::table('sale_items', function (Blueprint $table) {
            $table->foreignId('service_id')->nullable()->after('product_id')->constrained('services')->nullOnDelete();
            $table->text('notes')->nullable()->after('subtotal');
        });
    }

    public function down(): void
    {
        Schema::table('sale_items', function (Blueprint $table) {
            $table->dropForeign(['service_id']);
            $table->dropColumn(['service_id', 'notes']);
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn(['type', 'estimated_duration']);
        });
    }
};