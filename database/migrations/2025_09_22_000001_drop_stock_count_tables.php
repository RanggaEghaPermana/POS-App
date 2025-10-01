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
        // Drop stock count related tables
        Schema::dropIfExists('stock_count_items');
        Schema::dropIfExists('stock_counts');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Recreate stock_counts table
        Schema::create('stock_counts', function (Blueprint $table) {
            $table->id();
            $table->string('number')->unique();
            $table->string('status')->default('draft'); // draft, posted, cancelled
            $table->text('note')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('posted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('posted_at')->nullable();
            $table->timestamps();
        });

        // Recreate stock_count_items table
        Schema::create('stock_count_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stock_count_id')->constrained('stock_counts')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();
            $table->integer('system_qty');
            $table->integer('counted_qty')->default(0);
            $table->integer('variance_qty')->default(0);
            $table->text('note')->nullable();
            $table->timestamps();
            $table->unique(['stock_count_id','product_id']);
        });
    }
};