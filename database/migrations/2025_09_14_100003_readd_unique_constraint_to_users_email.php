<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Deduplicate existing emails by keeping the earliest and adjusting others
        try {
            $dups = DB::table('users')
                ->select('email', DB::raw('COUNT(*) as c'))
                ->groupBy('email')
                ->having('c', '>', 1)
                ->get();

            foreach ($dups as $dup) {
                $users = DB::table('users')->where('email', $dup->email)->orderBy('id')->get();
                $keepFirst = true;
                foreach ($users as $u) {
                    if ($keepFirst) { $keepFirst = false; continue; }
                    $parts = explode('@', $dup->email, 2);
                    $local = $parts[0] ?? $dup->email;
                    $domain = $parts[1] ?? '';
                    $newEmail = $domain ? ($local . '+' . $u->id . '@' . $domain) : ($dup->email . '.' . $u->id);
                    DB::table('users')->where('id', $u->id)->update(['email' => $newEmail]);
                }
            }
        } catch (\Throwable $e) {
            // ignore if table not exists yet or any error during fresh setup
        }

        Schema::table('users', function (Blueprint $table) {
            // Drop non-unique index if exists, then add unique
            try { $table->dropIndex('users_email_index'); } catch (\Throwable $e) {}
            try { $table->unique('email'); } catch (\Throwable $e) {}
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            try { $table->dropUnique('users_email_unique'); } catch (\Throwable $e) {}
            try { $table->index('email'); } catch (\Throwable $e) {}
        });
    }
};

