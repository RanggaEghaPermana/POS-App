<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;
use Symfony\Component\HttpFoundation\Response;

class OptionalTenantMiddleware
{
    /**
     * Handle an incoming request.
     * This middleware will switch to tenant database if tenant headers are provided,
     * but won't fail if no tenant is found.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $tenant = $this->identifyTenant($request);

        if ($tenant && $tenant->canAccess()) {
            try {
                $this->switchToTenantDatabase($tenant);

                // Store tenant in request context
                $request->attributes->set('tenant', $tenant);
                app()->instance('tenant', $tenant);

                \Log::info("Optional tenant switching: Using database {$tenant->database_name}");
            } catch (\Exception $e) {
                \Log::warning("Optional tenant switching failed, using default database: " . $e->getMessage());
                // Continue with default database if tenant switching fails
            }
        }

        $response = $next($request);

        // Add debug headers if tenant was used
        if ($tenant && config('app.debug') && method_exists($response, 'headers')) {
            $response->headers->set('X-Used-Tenant-Database', $tenant->database_name ?? 'default');
        }

        return $response;
    }

    /**
     * Identify tenant from headers only (simpler than full TenantMiddleware)
     */
    private function identifyTenant(Request $request): ?Tenant
    {
        // Check tenant slug header
        if ($request->hasHeader('X-Tenant-Slug')) {
            $slug = $request->header('X-Tenant-Slug');
            $tenant = Tenant::where('slug', $slug)->where('status', 'active')->first();
            if ($tenant) return $tenant;
        }

        // Check tenant ID header
        if ($request->hasHeader('X-Tenant-Id')) {
            $tenantId = $request->header('X-Tenant-Id');
            $tenant = Tenant::where('id', $tenantId)->where('status', 'active')->first();
            if ($tenant) return $tenant;
        }

        return null;
    }

    /**
     * Switch to tenant's database
     */
    private function switchToTenantDatabase(Tenant $tenant): void
    {
        $connectionName = "tenant_{$tenant->code}";
        $manager = app(\App\Services\Tenant\TenantDatabaseManager::class);

        $manager->ensureDatabaseExists($tenant);
        $manager->ensureConnectionConfigured($tenant);
        $manager->ensureSchema($tenant);

        // Switch to tenant database as default
        Config::set('database.default', $connectionName);
        DB::setDefaultConnection($connectionName);

        // Test connection
        DB::connection($connectionName)->getPdo();
    }

    /**
     * Cleanup after request
     */
    public function terminate(Request $request, Response $response): void
    {
        $tenant = $request->attributes->get('tenant');

        if ($tenant) {
            // Switch back to master database
            DB::setDefaultConnection('mysql');
            Config::set('database.default', 'mysql');
            app()->forgetInstance('tenant');
        }
    }
}