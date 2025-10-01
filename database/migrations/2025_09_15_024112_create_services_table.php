<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique(); // kode layanan (misal: FC-A4)
            $table->foreignId('service_category_id')->constrained('service_categories')->cascadeOnDelete();
            $table->decimal('base_price', 16, 2); // harga dasar
            $table->string('unit')->default('pcs'); // satuan (lembar, meter, halaman, etc)
            $table->text('description')->nullable();
            $table->json('pricing_tiers')->nullable(); // untuk harga bertingkat
            $table->integer('estimated_duration')->nullable(); // estimasi waktu (menit)
            $table->text('requirements')->nullable(); // persyaratan khusus
            $table->boolean('active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('services');
    }
};