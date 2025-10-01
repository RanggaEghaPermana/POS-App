<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            // Enhanced payment fields
            $table->string('transaction_id')->unique()->nullable()->after('reference');
            $table->string('gateway')->nullable()->after('method'); // midtrans, xendit, duitku, etc
            $table->string('gateway_response')->nullable()->after('gateway');
            $table->enum('status', ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'])
                  ->default('pending')->after('gateway_response');
            $table->json('metadata')->nullable()->after('status');
            $table->decimal('fee', 10, 2)->default(0)->after('amount');
            $table->decimal('net_amount', 10, 2)->nullable()->after('fee');

            // QR Code and Digital Wallet fields
            $table->string('qr_code_url')->nullable()->after('net_amount');
            $table->string('payment_url')->nullable()->after('qr_code_url');
            $table->datetime('expires_at')->nullable()->after('payment_url');

            // Customer info for payment
            $table->string('customer_name')->nullable()->after('expires_at');
            $table->string('customer_email')->nullable()->after('customer_name');
            $table->string('customer_phone')->nullable()->after('customer_email');

            // Installment fields
            $table->boolean('is_installment')->default(false)->after('customer_phone');
            $table->integer('installment_period')->nullable()->after('is_installment');
            $table->decimal('installment_amount', 10, 2)->nullable()->after('installment_period');

            // Add indexes
            $table->index(['gateway', 'status']);
            $table->index(['transaction_id']);
            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex(['gateway', 'status']);
            $table->dropIndex(['transaction_id']);
            $table->dropIndex(['status', 'created_at']);

            $table->dropColumn([
                'transaction_id', 'gateway', 'gateway_response', 'status',
                'metadata', 'fee', 'net_amount', 'qr_code_url', 'payment_url',
                'expires_at', 'customer_name', 'customer_email', 'customer_phone',
                'is_installment', 'installment_period', 'installment_amount'
            ]);
        });
    }
};