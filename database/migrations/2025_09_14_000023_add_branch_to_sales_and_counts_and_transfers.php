<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->foreignId('branch_id')->nullable()->after('cashier_id')->constrained('branches')->nullOnDelete();
        });
        // stock_counts table was dropped in later migration
        if (Schema::hasTable('stock_counts')) {
            Schema::table('stock_counts', function (Blueprint $table) {
                $table->foreignId('branch_id')->nullable()->after('number')->constrained('branches')->nullOnDelete();
            });
        }
        Schema::table('stock_transfers', function (Blueprint $table) {
            $table->foreignId('from_branch_id')->nullable()->after('status')->constrained('branches')->nullOnDelete();
            $table->foreignId('to_branch_id')->nullable()->after('from_branch_id')->constrained('branches')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropConstrainedForeignId('branch_id');
        });
        if (Schema::hasTable('stock_counts')) {
            Schema::table('stock_counts', function (Blueprint $table) {
                $table->dropConstrainedForeignId('branch_id');
            });
        }
        Schema::table('stock_transfers', function (Blueprint $table) {
            $table->dropConstrainedForeignId('from_branch_id');
            $table->dropConstrainedForeignId('to_branch_id');
        });
    }
};

