<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            if (!Schema::hasColumn('sales', 'fx_target')) {
                $table->string('fx_target')->nullable()->after('rounding_mode');
            }
            if (!Schema::hasColumn('sales', 'fx_rate_used')) {
                $table->decimal('fx_rate_used', 18, 8)->nullable()->after('fx_target');
            }
            if (!Schema::hasColumn('sales', 'fx_timestamp')) {
                $table->timestamp('fx_timestamp')->nullable()->after('fx_rate_used');
            }
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            if (Schema::hasColumn('sales', 'fx_timestamp')) $table->dropColumn('fx_timestamp');
            if (Schema::hasColumn('sales', 'fx_rate_used')) $table->dropColumn('fx_rate_used');
            if (Schema::hasColumn('sales', 'fx_target')) $table->dropColumn('fx_target');
        });
    }
};

