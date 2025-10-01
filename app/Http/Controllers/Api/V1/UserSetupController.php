<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;

class UserSetupController extends Controller
{
    public function store(Request $request)
    {
        // Normalize name for strict uniqueness (case-, accent-insensitive)
        $request->merge([
            'name_normalized' => Str::lower(Str::ascii((string) $request->input('name')))
        ]);

        $data = $request->validate([
            'name' => ['required','string','max:255'],
            'name_normalized' => ['required', Rule::unique('users','name_normalized')],
            'email' => ['required','email','max:255'],
            'password' => ['required','string','max:255'],
            'role' => ['nullable','string','max:255'],
        ]);

        if (($data['role'] ?? null) === 'super_admin') {
            return response()->json(['message' => 'Role super admin tidak tersedia pada tahap setup'], 403);
        }

        $user = new User();
        $user->name = $data['name'];
        $user->email = $data['email'];
        $user->password = $data['password']; // will be hashed by cast
        $user->save();

        if (!empty($data['role'])) {
            $role = \Spatie\Permission\Models\Role::firstOrCreate(['name'=>$data['role'], 'guard_name' => 'api']);
            $user->assignRole($role->name);
        }

        return response()->json([
            'user' => $user->only(['id','name','email']),
            'roles' => $user->getRoleNames()
        ], 201);
    }

    public function assignRole(Request $request, int $id)
    {
        $user = User::findOrFail($id);
        $data = $request->validate(['role' => ['required','string']]);

        if ($data['role'] === 'super_admin') {
            return response()->json(['message' => 'Role super admin tidak dapat diberikan pada tahap setup'], 403);
        }

        $role = \Spatie\Permission\Models\Role::firstOrCreate(['name'=>$data['role'], 'guard_name' => 'api']);
        $user->syncRoles([$role->name]);

        return response()->json([
            'user' => $user->only(['id','name','email']),
            'roles' => $user->getRoleNames()
        ]);
    }
}
