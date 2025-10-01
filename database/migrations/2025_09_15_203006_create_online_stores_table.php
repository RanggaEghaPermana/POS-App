<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('online_stores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('domain')->nullable()->unique();
            $table->string('logo')->nullable();
            $table->string('banner')->nullable();

            // Store settings
            $table->json('settings')->nullable(); // theme, colors, layout, etc.
            $table->json('shipping_settings')->nullable(); // shipping methods, rates, zones
            $table->json('payment_settings')->nullable(); // accepted payment methods
            $table->json('seo_settings')->nullable(); // meta tags, descriptions

            // Business info
            $table->string('contact_email')->nullable();
            $table->string('contact_phone')->nullable();
            $table->text('contact_address')->nullable();
            $table->json('business_hours')->nullable();

            // Features
            $table->boolean('is_active')->default(true);
            $table->boolean('allow_guest_checkout')->default(true);
            $table->boolean('require_email_verification')->default(false);
            $table->boolean('enable_reviews')->default(true);
            $table->boolean('enable_wishlist')->default(true);
            $table->boolean('enable_coupons')->default(true);

            // Analytics
            $table->string('google_analytics_id')->nullable();
            $table->string('facebook_pixel_id')->nullable();

            $table->timestamps();

            $table->index(['tenant_id', 'is_active']);
            $table->index(['slug']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('online_stores');
    }
};