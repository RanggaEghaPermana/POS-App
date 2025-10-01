<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Log;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    public function index()
    {
        $fallback = [
            ['id' => null, 'name' => 'super_admin', 'guard_name' => 'web'],
            ['id' => null, 'name' => 'admin', 'guard_name' => 'web'],
            ['id' => null, 'name' => 'manager', 'guard_name' => 'web'],
            ['id' => null, 'name' => 'cashier', 'guard_name' => 'web'],
        ];

        if (!class_exists(Role::class)) {
            Log::warning('Role model not available; returning fallback roles');

            return response()->json([
                'data' => $fallback,
                'total' => count($fallback),
                'message' => 'Daftar peran default ditampilkan karena modul role belum tersedia',
            ]);
        }

        try {
            $roles = Role::select('id', 'name', 'guard_name')
                ->orderBy('name')
                ->get();

            return response()->json([
                'data' => $roles,
                'total' => $roles->count(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('Unable to load roles for setup', ['error' => $e->getMessage()]);

            return response()->json([
                'data' => $fallback,
                'total' => count($fallback),
                'message' => 'Daftar peran default ditampilkan karena data belum tersedia',
            ]);
        }
    }
}
