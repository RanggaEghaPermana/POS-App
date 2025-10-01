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
        Schema::create('barbers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('specialties')->nullable(); // JSON array of specialties
            $table->decimal('commission_rate', 5, 2)->default(30.00); // Percentage
            $table->json('working_days')->nullable(); // [0,1,2,3,4,5,6] for days of week
            $table->time('start_time')->default('09:00:00');
            $table->time('end_time')->default('18:00:00');
            $table->enum('skill_level', ['junior', 'senior', 'master'])->default('junior');
            $table->decimal('rating', 3, 2)->default(0.00); // Average rating 0.00-5.00
            $table->integer('total_ratings')->default(0);
            $table->boolean('active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'active']);
            $table->index('skill_level');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('barbers');
    }
};
