<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $tenant = app('tenant');

        if (!$user) {
            return $next($request);
        }

        if ($user->hasRole('super_admin')) {
            return $next($request);
        }

        if (!$tenant) {
            return response()->json([
                'message' => 'Tenant context required for this request',
                'code' => 'TENANT_CONTEXT_MISSING',
            ], 400);
        }

        if ($user->tenant_id !== $tenant->id) {
            return response()->json([
                'message' => 'Anda tidak memiliki akses ke tenant ini',
                'code' => 'TENANT_ACCESS_FORBIDDEN',
            ], 403);
        }

        return $next($request);
    }
}
