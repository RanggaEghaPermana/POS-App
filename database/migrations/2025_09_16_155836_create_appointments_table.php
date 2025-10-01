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
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->string('customer_name');
            $table->string('customer_phone')->nullable();
            $table->foreignId('barber_id')->constrained()->onDelete('cascade');
            $table->json('service_ids'); // Array of barbershop_service IDs
            $table->date('appointment_date');
            $table->time('start_time');
            $table->time('end_time'); // Calculated from services duration
            $table->enum('status', ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'])->default('scheduled');
            $table->text('notes')->nullable();
            $table->integer('total_duration'); // Total minutes
            $table->decimal('total_price', 10, 2);
            $table->decimal('barber_commission', 10, 2)->nullable();
            $table->string('before_photo')->nullable();
            $table->string('after_photo')->nullable();
            $table->integer('customer_rating')->nullable(); // 1-5 stars
            $table->text('customer_feedback')->nullable();
            $table->timestamp('checked_in_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['appointment_date', 'barber_id']);
            $table->index(['status', 'appointment_date']);
            $table->index('customer_phone');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};
