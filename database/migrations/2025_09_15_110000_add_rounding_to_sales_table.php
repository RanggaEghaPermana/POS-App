<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->decimal('rounding_adjustment', 16, 2)->default(0)->after('tax');
            $table->string('rounding_policy')->nullable()->after('rounding_adjustment');
            $table->string('rounding_mode')->nullable()->after('rounding_policy');
            $table->string('fx_target')->nullable()->after('rounding_mode');
            $table->decimal('fx_rate_used', 18, 8)->nullable()->after('fx_target');
            $table->timestamp('fx_timestamp')->nullable()->after('fx_rate_used');
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn(['rounding_adjustment','rounding_policy','rounding_mode','fx_target','fx_rate_used','fx_timestamp']);
        });
    }
};
