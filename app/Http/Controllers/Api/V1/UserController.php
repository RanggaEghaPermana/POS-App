<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class UserController extends Controller
{
    public function index()
    {
        try {
            $users = User::with(['roles:id,name'])
                ->select('id', 'name', 'email')
                ->orderBy('name')
                ->limit(100)
                ->get();

            return response()->json([
                'data' => $users,
                'total' => $users->count(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('Unable to load users for setup', ['error' => $e->getMessage()]);

            return response()->json([
                'data' => [],
                'total' => 0,
                'message' => 'Daftar pengguna belum tersedia',
            ]);
        }
    }

    public function cashiers(Request $request)
    {
        $user = $request->user();
        $tenant = app('tenant');

        if ($user && $user->hasRole('cashier')) {
            // Cashier sees only themselves for filtering
            return response()->json(
                User::where('id', $user->id)
                    ->when($tenant, fn($q) => $q->where('tenant_id', $tenant->id))
                    ->get(['id','name','email'])
            );
        }
        $rows = User::role('cashier')
            ->when($tenant, fn($q) => $q->where('tenant_id', $tenant->id))
            ->orderBy('name')
            ->get(['id','name','email']);
        return response()->json($rows);
    }

    public function tenants(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['data' => []]);
        }

        if ($user->hasRole('super_admin')) {
            $tenants = Tenant::orderBy('name')->get(['id','name','slug','business_type']);

            return response()->json([
                'data' => $tenants,
            ]);
        }

        if (!$user->tenant_id) {
            return response()->json(['data' => []]);
        }

        $tenant = Tenant::find($user->tenant_id);

        if (!$tenant) {
            return response()->json(['data' => []]);
        }

        return response()->json([
            'data' => [[
                'id' => $tenant->id,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'business_type' => $tenant->business_type,
            ]],
        ]);
    }
}
