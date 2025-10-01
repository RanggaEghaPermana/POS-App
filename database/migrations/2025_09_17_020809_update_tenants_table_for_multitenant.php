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
        Schema::table('tenants', function (Blueprint $table) {
            // Add new fields for multi-tenant database isolation
            $table->string('slug')->nullable()->after('id');
            $table->string('business_type')->default('general')->after('name');
            $table->string('database_username')->nullable()->after('database_name');
            $table->string('database_password')->nullable()->after('database_username');
            $table->string('database_host')->default('localhost')->after('database_password');
            $table->string('database_port')->default('3306')->after('database_host');

            // Business owner information
            $table->string('owner_name')->nullable()->after('business_type');
            $table->string('owner_email')->nullable()->after('owner_name');
            $table->string('phone')->nullable()->after('owner_email');
            $table->text('address')->nullable()->after('phone');
            $table->string('city')->nullable()->after('address');
            $table->string('state')->nullable()->after('city');
            $table->string('country')->default('Indonesia')->after('state');
            $table->string('postal_code')->nullable()->after('country');

            // Subscription management
            $table->string('plan')->default('free')->after('postal_code');
            $table->integer('max_users')->default(3)->after('plan');
            $table->integer('max_products')->default(100)->after('max_users');
            $table->integer('max_transactions_per_month')->default(1000)->after('max_products');

            // Security & tracking
            $table->string('encryption_key')->nullable()->after('settings');
            $table->timestamp('last_accessed_at')->nullable()->after('encryption_key');
            $table->ipAddress('last_ip')->nullable()->after('last_accessed_at');

            // Add indexes for performance
            $table->index(['slug', 'status']);
            $table->index(['business_type', 'status']);
            $table->index('owner_email');
        });

        // Make slug unique after adding it
        Schema::table('tenants', function (Blueprint $table) {
            $table->unique('slug');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn([
                'slug',
                'business_type',
                'database_username',
                'database_password',
                'database_host',
                'database_port',
                'owner_name',
                'owner_email',
                'phone',
                'address',
                'city',
                'state',
                'country',
                'postal_code',
                'plan',
                'max_users',
                'max_products',
                'max_transactions_per_month',
                'encryption_key',
                'last_accessed_at',
                'last_ip'
            ]);
        });
    }
};
