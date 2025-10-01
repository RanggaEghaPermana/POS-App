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
        if (Schema::hasTable('tenants')) {
            return;
        }

        Schema::create('tenants', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique(); // tenant identifier (domain/subdomain)
            $table->string('name'); // business name
            $table->string('business_type')->default('general'); // pharmacy, clinic, retail, etc
            $table->string('database_name')->unique(); // dedicated database name
            $table->string('domain')->nullable(); // custom domain
            $table->string('subdomain')->nullable(); // subdomain.app.com

            // Business Details
            $table->string('owner_name');
            $table->string('owner_email');
            $table->string('phone')->nullable();
            $table->text('address')->nullable();
            $table->string('city')->nullable();
            $table->string('state')->nullable();
            $table->string('country')->default('Indonesia');
            $table->string('postal_code')->nullable();

            // Subscription & Billing
            $table->enum('plan', ['free', 'basic', 'premium', 'enterprise'])->default('free');
            $table->integer('max_users')->default(3);
            $table->integer('max_products')->default(100);
            $table->integer('max_transactions_per_month')->default(1000);
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('subscription_ends_at')->nullable();

            // Technical
            $table->string('database_host')->default('localhost');
            $table->string('database_port')->default('3306');
            $table->string('database_username');
            $table->string('database_password');
            $table->enum('status', ['active', 'suspended', 'inactive'])->default('active');
            $table->json('settings')->nullable(); // business-specific settings

            // Security
            $table->string('encryption_key')->nullable(); // for tenant-specific encryption
            $table->timestamp('last_accessed_at')->nullable();
            $table->ipAddress('last_ip')->nullable();

            $table->timestamps();

            // Indexes for performance
            $table->index(['slug', 'status']);
            $table->index(['business_type', 'status']);
            $table->index('domain');
            $table->index('subdomain');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
};
