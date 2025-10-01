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
        Schema::create('barbershop_services', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->integer('duration_minutes')->default(30); // Default 30 minutes
            $table->decimal('base_price', 10, 2);
            $table->decimal('barber_commission_percent', 5, 2)->default(30.00);
            $table->enum('category', ['haircut', 'shave', 'styling', 'treatment', 'combo'])->default('haircut');
            $table->json('requirements')->nullable(); // Special tools, products needed
            $table->boolean('active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index(['category', 'active']);
            $table->index('sort_order');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('barbershop_services');
    }
};
