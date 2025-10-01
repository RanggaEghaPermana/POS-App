<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Check if columns don't exist before adding them
            if (!Schema::hasColumn('products', 'brand')) {
                $table->string('brand')->nullable()->after('image_path');
            }
            if (!Schema::hasColumn('products', 'cost_price')) {
                $table->decimal('cost_price', 15, 2)->nullable()->after('brand');
            }
            if (!Schema::hasColumn('products', 'margin_percentage')) {
                $table->decimal('margin_percentage', 5, 2)->nullable()->after('cost_price');
            }
            if (!Schema::hasColumn('products', 'supplier')) {
                $table->string('supplier')->nullable()->after('margin_percentage');
            }
            if (!Schema::hasColumn('products', 'unit_type')) {
                $table->string('unit_type', 50)->default('pcs')->after('supplier');
            }
            if (!Schema::hasColumn('products', 'weight')) {
                $table->string('weight', 100)->nullable()->after('unit_type');
            }
            if (!Schema::hasColumn('products', 'dimensions')) {
                $table->string('dimensions')->nullable()->after('weight');
            }
            if (!Schema::hasColumn('products', 'expired_date')) {
                $table->date('expired_date')->nullable()->after('dimensions');
            }
            if (!Schema::hasColumn('products', 'minimum_stock')) {
                $table->integer('minimum_stock')->nullable()->after('expired_date');
            }
            if (!Schema::hasColumn('products', 'location')) {
                $table->string('location')->nullable()->after('minimum_stock');
            }
            if (!Schema::hasColumn('products', 'tax_rate')) {
                $table->decimal('tax_rate', 5, 2)->nullable()->after('location');
            }
            if (!Schema::hasColumn('products', 'discount_percentage')) {
                $table->decimal('discount_percentage', 5, 2)->nullable()->after('tax_rate');
            }
            if (!Schema::hasColumn('products', 'notes')) {
                $table->text('notes')->nullable()->after('discount_percentage');
            }
            if (!Schema::hasColumn('products', 'dynamic_fields')) {
                $table->json('dynamic_fields')->nullable()->after('notes');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn([
                'brand', 'cost_price', 'margin_percentage', 'supplier', 'unit_type',
                'weight', 'dimensions', 'expired_date', 'minimum_stock', 'location',
                'tax_rate', 'discount_percentage', 'notes', 'dynamic_fields'
            ]);
        });
    }
};