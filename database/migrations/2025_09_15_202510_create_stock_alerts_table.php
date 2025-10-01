<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_alerts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('branch_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->constrained()->onDelete('cascade');

            $table->enum('alert_type', ['low_stock', 'out_of_stock', 'expiring_soon', 'expired', 'reorder']);
            $table->integer('current_stock');
            $table->integer('minimum_stock')->nullable();
            $table->integer('reorder_level')->nullable();
            $table->integer('reorder_quantity')->nullable();

            // For expiry alerts
            $table->date('expiry_date')->nullable();
            $table->integer('days_to_expiry')->nullable();

            $table->enum('priority', ['low', 'medium', 'high', 'critical'])->default('medium');
            $table->boolean('is_active')->default(true);
            $table->datetime('triggered_at');
            $table->datetime('acknowledged_at')->nullable();
            $table->foreignId('acknowledged_by')->nullable()->constrained('users')->onDelete('set null');
            $table->datetime('resolved_at')->nullable();
            $table->foreignId('resolved_by')->nullable()->constrained('users')->onDelete('set null');

            $table->text('message');
            $table->text('resolution_notes')->nullable();
            $table->json('metadata')->nullable();

            $table->timestamps();

            // Indexes
            $table->index(['tenant_id', 'branch_id', 'alert_type']);
            $table->index(['is_active', 'priority']);
            $table->index(['triggered_at']);
            $table->index(['expiry_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_alerts');
    }
};