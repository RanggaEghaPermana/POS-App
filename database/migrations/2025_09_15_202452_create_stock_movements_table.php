<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('branch_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // who made the movement

            // Movement details
            $table->enum('type', ['in', 'out', 'adjustment', 'transfer']);
            $table->enum('reason', [
                'purchase', 'sale', 'return', 'adjustment', 'transfer_in', 'transfer_out',
                'damaged', 'expired', 'lost', 'initial_stock', 'recount'
            ]);
            $table->integer('quantity'); // positive for in, negative for out
            $table->integer('quantity_before');
            $table->integer('quantity_after');

            // Cost tracking
            $table->decimal('unit_cost', 15, 4)->nullable();
            $table->decimal('total_cost', 15, 2)->nullable();

            // Reference documents
            $table->foreignId('sale_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('stock_transfer_id')->nullable()->constrained()->onDelete('set null');
            $table->string('reference_type')->nullable(); // purchase_order, adjustment, etc.
            $table->string('reference_id')->nullable();

            // Batch/Serial tracking
            $table->string('batch_number')->nullable();
            $table->string('serial_number')->nullable();
            $table->date('expiry_date')->nullable();
            $table->date('manufacture_date')->nullable();

            $table->text('notes')->nullable();
            $table->json('metadata')->nullable();

            $table->timestamps();

            // Indexes for performance
            $table->index(['tenant_id', 'branch_id', 'product_id']);
            $table->index(['type', 'reason']);
            $table->index(['created_at']);
            $table->index(['batch_number']);
            $table->index(['expiry_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};