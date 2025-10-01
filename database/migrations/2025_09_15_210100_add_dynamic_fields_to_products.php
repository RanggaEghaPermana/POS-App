<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('products', function (Blueprint $table) {
            // Universal fields yang sudah ada tetap

            // Dynamic fields based on business type
            $table->json('dynamic_fields')->nullable(); // Store business-specific data

            // Extended common fields
            $table->string('brand')->nullable();
            $table->decimal('cost_price', 15, 2)->nullable(); // Harga modal
            $table->decimal('margin_percentage', 5, 2)->nullable();
            $table->string('supplier')->nullable();
            $table->string('unit_type')->default('pcs'); // pcs, kg, liter, hour, etc
            $table->decimal('weight', 8, 3)->nullable();
            $table->string('dimensions')->nullable(); // JSON or string
            $table->date('expired_date')->nullable();
            $table->integer('minimum_stock')->default(0);
            $table->string('location')->nullable(); // Rak/lokasi penyimpanan
            $table->boolean('track_serial')->default(false);
            $table->json('variants')->nullable(); // Size, color, etc
            $table->text('notes')->nullable();

            // Tax and discount
            $table->decimal('tax_rate', 5, 2)->default(0);
            $table->boolean('tax_inclusive')->default(false);
            $table->decimal('discount_percentage', 5, 2)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);

            // Business-specific booleans
            $table->boolean('is_service')->default(false);
            $table->boolean('is_digital')->default(false);
            $table->boolean('requires_prescription')->default(false);
            $table->boolean('age_restricted')->default(false);
        });

        // Update services table to support dynamic fields too
        Schema::table('services', function (Blueprint $table) {
            $table->json('dynamic_fields')->nullable();
            $table->string('difficulty_level')->nullable(); // Easy, Medium, Hard
            $table->json('required_tools')->nullable();
            $table->json('required_skills')->nullable();
            $table->string('location_type')->default('in_store'); // in_store, on_site, remote
            $table->integer('warranty_days')->default(0);
            $table->boolean('follow_up_required')->default(false);
            $table->text('safety_notes')->nullable();
        });
    }

    public function down()
    {
        Schema::table('services', function (Blueprint $table) {
            $table->dropColumn([
                'dynamic_fields', 'difficulty_level', 'required_tools',
                'required_skills', 'location_type', 'warranty_days',
                'follow_up_required', 'safety_notes'
            ]);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn([
                'dynamic_fields', 'brand', 'cost_price', 'margin_percentage',
                'supplier', 'unit_type', 'weight', 'dimensions', 'expired_date',
                'minimum_stock', 'location', 'track_serial', 'variants', 'notes',
                'tax_rate', 'tax_inclusive', 'discount_percentage', 'discount_amount',
                'is_service', 'is_digital', 'requires_prescription', 'age_restricted'
            ]);
        });
    }
};