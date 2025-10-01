<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\StaffSchedule;
use App\Models\Tenant;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => ['required','email'],
            'password' => ['required','string'],
            'device_name' => ['required','string'],
            'role' => ['nullable','string']
        ]);

        // If role is provided, find user by email AND role to disambiguate duplicates
        if (!empty($data['role'])) {
            $user = User::where('email', $data['email'])
                ->whereHas('roles', function($q) use ($data) { $q->where('name', $data['role']); })
                ->first();
        } else {
            $user = User::where('email', $data['email'])->first();
        }
        if(!$user || !Hash::check($data['password'], $user->password)){
            return response()->json(['message' => 'Kredensial tidak valid'], 401);
        }
        // Shift validation for non-admin/manager (if schedules exist)
        if (!($user->hasRole('super_admin') || $user->hasRole('admin') || $user->hasRole('manager'))) {
            $exists = StaffSchedule::where('user_id', $user->id)->exists();
            if ($exists) {
                $dow = (int)now()->dayOfWeek; // 0=Sun
                $time = now()->format('H:i:s');
                $ok = StaffSchedule::where('user_id', $user->id)
                    ->where('day_of_week', $dow)
                    ->where(function($q) use ($time) {
                        $q->where(function($qq) use ($time){
                            $qq->whereColumn('start_time','<=','end_time')
                               ->where('start_time','<=',$time)
                               ->where('end_time','>=',$time);
                        })->orWhere(function($qq) use ($time){
                            $qq->whereColumn('start_time','>','end_time')
                               ->where(function($qx) use ($time){
                                   $qx->where('start_time','<=',$time)
                                      ->orWhere('end_time','>=',$time);
                               });
                        });
                    })
                    ->exists();
                if (!$ok) {
                    return response()->json(['message' => 'Di luar jam shift'], 423);
                }
            }
        }

        // Grant broad abilities; you can restrict per role later
        $token = $user->createToken($data['device_name'])->plainTextToken;
        // Login history
        \DB::table('login_histories')->insert([
            'user_id' => $user->id,
            'ip' => $request->ip(),
            'user_agent' => substr((string)$request->userAgent(),0,500),
            'logged_in_at' => now(),
        ]);
        $primaryTenant = null;
        $tenantOptions = [];

        if ($user->hasRole('super_admin')) {
            $tenantOptions = Tenant::orderBy('name')->get(['id','name','slug','business_type'])->map(function ($tenant) {
                return [
                    'id' => $tenant->id,
                    'name' => $tenant->name,
                    'slug' => $tenant->slug,
                    'business_type' => $tenant->business_type,
                ];
            })->toArray();
        } elseif ($user->tenant_id) {
            $tenant = Tenant::find($user->tenant_id);
            if ($tenant) {
                $primaryTenant = [
                    'id' => $tenant->id,
                    'name' => $tenant->name,
                    'slug' => $tenant->slug,
                    'business_type' => $tenant->business_type,
                ];
                $tenantOptions[] = $primaryTenant;
            }
        }

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->getRoleNames(),
                'tenant_id' => $user->tenant_id,
                'tenant' => $primaryTenant,
                'tenants' => $tenantOptions,
            ]
        ]);
    }

    public function logout(Request $request)
    {
        if ($request->user()) {
            $request->user()->currentAccessToken()?->delete();
        }
        return response()->json(['message' => 'Logged out']);
    }
}
