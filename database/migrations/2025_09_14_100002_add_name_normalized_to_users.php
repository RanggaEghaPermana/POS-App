<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'name_normalized')) {
                $table->string('name_normalized')->nullable()->after('name');
            }
        });

        // Backfill normalized names
        try {
            DB::table('users')->select('id', 'name')->orderBy('id')->chunkById(200, function ($rows) {
                foreach ($rows as $row) {
                    $norm = Str::lower(Str::ascii((string) $row->name));
                    DB::table('users')->where('id', $row->id)->update(['name_normalized' => $norm]);
                }
            });
        } catch (\Throwable $e) {
            // ignore during fresh setups
        }

        Schema::table('users', function (Blueprint $table) {
            try { $table->unique('name_normalized', 'users_name_normalized_unique'); } catch (\Throwable $e) {}
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            try { $table->dropUnique('users_name_normalized_unique'); } catch (\Throwable $e) {}
            if (Schema::hasColumn('users', 'name_normalized')) {
                $table->dropColumn('name_normalized');
            }
        });
    }
};

