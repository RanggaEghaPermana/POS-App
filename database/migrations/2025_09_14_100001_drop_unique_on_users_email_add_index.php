<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Drop unique constraint on email (default index name in Laravel)
            try {
                $table->dropUnique('users_email_unique');
            } catch (\Throwable $e) {
                // Index may already be dropped; ignore
            }
            // Add a normal index to keep lookups fast
            try {
                $table->index('email');
            } catch (\Throwable $e) {
                // Ignore if index already exists
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Remove non-unique index and restore unique
            try {
                $table->dropIndex(['email']);
            } catch (\Throwable $e) {
                // Ignore
            }
            try {
                $table->unique('email');
            } catch (\Throwable $e) {
                // Ignore
            }
        });
    }
};

