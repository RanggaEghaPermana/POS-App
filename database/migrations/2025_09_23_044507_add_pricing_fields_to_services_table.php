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
        Schema::table('services', function (Blueprint $table) {
            $table->enum('pricing_mode', ['fixed', 'barber', 'combined'])->nullable();
            $table->unsignedBigInteger('barber_id')->nullable();
            $table->decimal('barber_rate', 10, 2)->nullable();
            $table->decimal('treatment_fee', 10, 2)->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->dropColumn(['pricing_mode', 'barber_id', 'barber_rate', 'treatment_fee']);
        });
    }
};
