<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('code')->unique();
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->text('address')->nullable();
            $table->date('birth_date')->nullable();
            $table->enum('gender', ['male', 'female', 'other'])->nullable();
            $table->string('id_number')->nullable(); // KTP/ID
            $table->enum('customer_type', ['individual', 'corporate'])->default('individual');
            $table->string('company_name')->nullable();
            $table->string('tax_number')->nullable(); // NPWP

            // Loyalty Program
            $table->integer('loyalty_points')->default(0);
            $table->enum('membership_tier', ['bronze', 'silver', 'gold', 'platinum'])->default('bronze');
            $table->date('membership_since')->nullable();
            $table->date('membership_expires_at')->nullable();

            // Purchase behavior
            $table->decimal('total_spent', 15, 2)->default(0);
            $table->integer('total_transactions')->default(0);
            $table->decimal('average_transaction', 15, 2)->default(0);
            $table->datetime('last_purchase_at')->nullable();
            $table->datetime('first_purchase_at')->nullable();

            // Contact preferences
            $table->boolean('email_notifications')->default(true);
            $table->boolean('sms_notifications')->default(true);
            $table->boolean('whatsapp_notifications')->default(true);
            $table->boolean('marketing_consent')->default(false);

            // Status
            $table->boolean('active')->default(true);
            $table->text('notes')->nullable();
            $table->json('metadata')->nullable();

            $table->timestamps();

            // Indexes
            $table->index(['tenant_id', 'code']);
            $table->index(['email']);
            $table->index(['phone']);
            $table->index(['membership_tier']);
            $table->index(['last_purchase_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};