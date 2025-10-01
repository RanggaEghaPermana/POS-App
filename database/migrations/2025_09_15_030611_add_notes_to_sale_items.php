<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('sale_items', 'notes')) {
            Schema::table('sale_items', function (Blueprint $table) {
                $table->text('notes')->nullable()->after('subtotal');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('sale_items', 'notes')) {
            Schema::table('sale_items', function (Blueprint $table) {
                $table->dropColumn('notes');
            });
        }
    }
};
