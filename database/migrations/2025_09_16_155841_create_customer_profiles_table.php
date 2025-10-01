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
        Schema::create('customer_profiles', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('phone')->unique();
            $table->string('email')->nullable();
            $table->date('date_of_birth')->nullable();
            $table->enum('hair_type', ['straight', 'wavy', 'curly', 'coily'])->nullable();
            $table->string('preferred_style')->nullable();
            $table->text('allergies')->nullable();
            $table->date('last_visit')->nullable();
            $table->integer('visit_frequency_days')->nullable(); // How often they visit
            $table->foreignId('preferred_barber_id')->nullable()->constrained('barbers')->onDelete('set null');
            $table->text('notes')->nullable();
            $table->integer('total_visits')->default(0);
            $table->decimal('total_spent', 10, 2)->default(0.00);
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->index('phone');
            $table->index('last_visit');
            $table->index(['preferred_barber_id', 'active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customer_profiles');
    }
};
