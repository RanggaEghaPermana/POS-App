<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

class UserAdminController extends Controller
{
    public function index(Request $request)
    {
        // Include roles so frontend can display current role
        $actingUser = $request->user();
        $currentTenant = app('tenant');

        $query = User::with(['roles:id,name'])
            ->orderBy('name')
            ->when($currentTenant, fn($q) => $q->where('tenant_id', $currentTenant->id))
            ->when(!$actingUser?->hasRole('super_admin'), function ($q) use ($actingUser) {
                if ($actingUser?->tenant_id) {
                    $q->where('tenant_id', $actingUser->tenant_id);
                }
                $q->whereDoesntHave('roles', fn($r) => $r->where('name', 'super_admin'));
            });

        if ($actingUser?->hasRole('manager')) {
            $query->whereDoesntHave('roles', function($q){ $q->where('name','admin'); });
        }

        $users = $query->get(['id','name','email','tenant_id']);
        return response()->json($users);
    }

    public function roles()
    {
        $currentUser = request()->user();
        $roles = Role::orderBy('name')->get(['id','name']);

        if (!$currentUser?->hasRole('super_admin')) {
            $roles = $roles->filter(fn($r) => $r->name !== 'super_admin');
        }

        if ($currentUser?->hasRole('manager')) {
            // Managers should not see admin role
            $roles = $roles->filter(fn($r) => $r->name !== 'admin');
        }

        return response()->json($roles->values());
    }

    public function assignRole(Request $request, int $id)
    {
        $actingUser = $request->user();
        $user = User::findOrFail($id);
        $currentTenant = app('tenant');

        $data = $request->validate([
            'role' => ['required','string'],
        ]);

        if (!$actingUser->hasRole('super_admin')) {
            if ($user->tenant_id !== $actingUser->tenant_id) {
                return response()->json(['message' => 'Tidak boleh mengubah user di tenant lain'], 403);
            }
            if ($user->hasRole('super_admin') || $data['role'] === 'super_admin') {
                return response()->json(['message' => 'Role super admin hanya dapat diubah oleh super admin'], 403);
            }
        }

        if ($actingUser->hasRole('manager')) {
            if ($user->hasRole('admin')) {
                return response()->json(['message' => 'Tidak boleh mengubah akun admin'], 403);
            }
            if (in_array($data['role'], ['admin', 'super_admin'], true)) {
                return response()->json(['message' => 'Manager tidak boleh menetapkan role tersebut'], 403);
            }
        }

        if ($data['role'] === 'super_admin') {
            $existingSuperAdmin = User::role('super_admin')
                ->when($user->exists, fn($q) => $q->where('id', '!=', $user->id))
                ->exists();
            if ($existingSuperAdmin) {
                return response()->json(['message' => 'Super admin hanya boleh satu akun'], 422);
            }
        }

        if ($actingUser->hasRole('super_admin') && $currentTenant && $user->tenant_id !== $currentTenant->id) {
            // Sync user to current tenant context when super admin manages across businesses
            $user->tenant_id = $currentTenant->id;
            $user->save();
        }

        $role = Role::firstOrCreate(['name' => $data['role'], 'guard_name' => 'api']);
        $user->syncRoles([$role->name]);

        return response()->json([
            'user' => $user->only(['id','name','email','tenant_id']),
            'roles' => $user->getRoleNames(),
        ]);
    }

    public function store(Request $request)
    {
        // Normalize name for strict uniqueness (case-, accent-insensitive)
        $request->merge([
            'name_normalized' => Str::lower(Str::ascii((string) $request->input('name')))
        ]);

        $data = $request->validate([
            'name' => ['required','string','max:255'],
            'name_normalized' => ['required', Rule::unique('users','name_normalized')],
            'email' => ['required','email','max:255'], // email intentionally not unique
            'password' => ['required','string','max:255'],
            'role' => ['nullable','string','max:255'],
            'tenant_id' => ['nullable','integer','exists:tenants,id'],
        ]);

        $actingUser = $request->user();
        $currentTenant = app('tenant');

        // Manager restrictions: only allowed to create cashier accounts
        if ($actingUser->hasRole('manager')) {
            if (!in_array(($data['role'] ?? 'cashier'), ['cashier'], true)) {
                return response()->json(['message' => 'Manager hanya boleh membuat akun kasir'], 403);
            }
        }

        if (!$actingUser->hasRole('super_admin') && ($data['role'] ?? null) === 'super_admin') {
            return response()->json(['message' => 'Role super admin hanya boleh dibuat oleh super admin'], 403);
        }

        if (($data['role'] ?? null) === 'super_admin') {
            $existingSuperAdmin = User::role('super_admin')->exists();
            if ($existingSuperAdmin) {
                return response()->json(['message' => 'Super admin hanya boleh satu akun'], 422);
            }
        }

        if ($actingUser->hasRole('super_admin')) {
            $tenantId = $data['tenant_id'] ?? $currentTenant?->id;
            if (!$tenantId) {
                return response()->json(['message' => 'Tenant harus dipilih saat membuat user'], 422);
            }
        } else {
            $tenantId = $currentTenant?->id ?? $actingUser->tenant_id;
        }

        if (!$tenantId) {
            return response()->json(['message' => 'User harus terikat pada tenant'], 422);
        }

        $user = new User();
        $user->name = $data['name'];
        $user->email = $data['email'];
        $user->password = $data['password']; // will be hashed by cast
        $user->tenant_id = $tenantId;
        $user->save();

        if (!empty($data['role'])) {
            $role = Role::firstOrCreate(['name' => $data['role'], 'guard_name' => 'api']);
            $user->syncRoles([$role->name]);
        }

        return response()->json([
            'user' => $user->only(['id','name','email','tenant_id']),
            'roles' => $user->getRoleNames(),
        ], 201);
    }

    public function changePassword(Request $request, int $id)
    {
        $actingUser = $request->user();
        $user = User::findOrFail($id);
        $data = $request->validate([
            'password' => ['required','string'],
        ]);
        $min = (int)(\App\Models\AppSetting::where('key','security')->value('value') ? (json_decode(\App\Models\AppSetting::where('key','security')->value('value'), true)['password_min'] ?? 8) : 8);
        if (strlen($data['password']) < $min) {
            return response()->json(['message' => 'Password terlalu pendek (min '.$min.')'], 422);
        }
        if (!$actingUser->hasRole('super_admin') && $user->tenant_id !== $actingUser->tenant_id) {
            return response()->json(['message' => 'Tidak boleh mengubah user di tenant lain'], 403);
        }
        if (!$actingUser->hasRole('super_admin') && $user->hasRole('super_admin')) {
            return response()->json(['message' => 'Tidak boleh mengubah password super admin'], 403);
        }
        if ($actingUser->hasRole('manager') && $user->hasRole('admin')) {
            return response()->json(['message' => 'Tidak boleh mengubah password admin'], 403);
        }
        $user->password = $data['password'];
        $user->save();
        return response()->json(['updated' => true]);
    }
}
