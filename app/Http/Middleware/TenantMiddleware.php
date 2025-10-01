<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class TenantMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $tenant = $this->identifyTenant($request);

        if (!$tenant) {
            return response()->json([
                'error' => 'Tenant not found',
                'message' => 'Invalid domain or tenant not active',
                'code' => 'TENANT_NOT_FOUND'
            ], 404);
        }

        // Security: Check if tenant is active and not suspended
        if (!$tenant->canAccess()) {
            return response()->json([
                'error' => 'Access denied',
                'message' => 'Tenant access suspended or subscription expired',
                'code' => 'TENANT_ACCESS_DENIED'
            ], 403);
        }

        // Check usage limits for tenant (disabled for now to avoid database connection issues)
        // $limits = $tenant->hasReachedLimits();
        // if ($limits['users'] || $limits['products'] || $limits['transactions']) {
        //     \Log::warning("Tenant {$tenant->code} has reached usage limits", $limits);
        // }

        $this->switchToTenantDatabase($tenant);

        // Store tenant in request and application context
        $request->attributes->set('tenant', $tenant);
        app()->instance('tenant', $tenant);

        // Update security tracking (disabled - columns not exist)
        // $tenant->updateLastAccess($request->ip());

        $response = $next($request);

        // Add tenant info to response headers for debugging
        if (config('app.debug') && method_exists($response, 'headers')) {
            $response->headers->set('X-Tenant-Code', $tenant->code);
            $response->headers->set('X-Tenant-Database', $tenant->database_name);
        }

        return $response;
    }

    /**
     * Identify tenant from multiple sources
     */
    private function identifyTenant(Request $request): ?Tenant
    {
        // 1. Priority: Custom header for API calls
        if ($request->hasHeader('X-Tenant-Slug')) {
            $slug = $request->header('X-Tenant-Slug');
            $tenant = Tenant::where('slug', $slug)->where('status', 'active')->first();
            if ($tenant) return $tenant;
        }

        if ($request->hasHeader('X-Tenant-Id')) {
            $tenantId = $request->header('X-Tenant-Id');
            $tenant = Tenant::where('id', $tenantId)->where('status', 'active')->first();
            if ($tenant) return $tenant;
        }

        if ($request->query('tenant_id')) {
            $tenant = Tenant::where('id', $request->query('tenant_id'))->where('status', 'active')->first();
            if ($tenant) return $tenant;
        }

        // 2. Check subdomain (app.domain.com)
        $host = $request->getHost();
        $subdomain = $this->extractSubdomain($host);

        if ($subdomain) {
            $tenant = Tenant::where('subdomain', $subdomain)->where('status', 'active')->first();
            if ($tenant) return $tenant;
        }

        // 3. Check custom domain
        $tenant = Tenant::where('domain', $host)->where('status', 'active')->first();
        if ($tenant) return $tenant;

        // 4. Fallback: Check session for admin access (only if session is available)
        if ($request->hasSession() && $request->session()->has('admin_tenant_slug')) {
            $slug = $request->session()->get('admin_tenant_slug');
            return Tenant::where('slug', $slug)->where('status', 'active')->first();
        }

        return null;
    }

    /**
     * Extract subdomain from host
     */
    private function extractSubdomain(string $host): ?string
    {
        $appDomain = config('app.domain', 'localhost');

        // Remove main domain to get subdomain
        if (Str::endsWith($host, '.' . $appDomain)) {
            $subdomain = Str::replaceLast('.' . $appDomain, '', $host);

            // Skip reserved subdomains
            $reserved = ['www', 'api', 'admin', 'app', 'dashboard', 'mail'];
            if (!in_array($subdomain, $reserved)) {
                return $subdomain;
            }
        }

        return null;
    }

    /**
     * Switch to tenant's isolated database
     */
    private function switchToTenantDatabase(Tenant $tenant): void
    {
        try {
            // Create dynamic connection name
            $connectionName = "tenant_{$tenant->code}";
            $manager = app(\App\Services\Tenant\TenantDatabaseManager::class);
            $manager->ensureDatabaseExists($tenant);
            $manager->ensureConnectionConfigured($tenant);
            $manager->ensureSchema($tenant);

            // Switch to tenant database as default
            Config::set('database.default', $connectionName);
            DB::setDefaultConnection($connectionName);

            // Test connection to ensure database is accessible
            DB::connection($connectionName)->getPdo();

            \Log::info("Connected to tenant database: {$tenant->code}");

        } catch (\Exception $e) {
            \Log::error("Failed to connect to tenant database {$tenant->code}: " . $e->getMessage());

            // Critical: Fallback to master database to prevent complete failure
            DB::setDefaultConnection('mysql');

            throw new \Exception("Database connection failed for tenant: {$tenant->code}");
        }
    }

    /**
     * Handle cleanup after request completion
     */
    public function terminate(Request $request, Response $response): void
    {
        $tenant = $request->attributes->get('tenant');

        if ($tenant) {
            // Log tenant access for analytics and security
            \Log::info("Tenant request completed", [
                'tenant_code' => $tenant->code,
                'tenant_database' => $tenant->database_name,
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'path' => $request->path(),
                'method' => $request->method(),
                'status' => $response->getStatusCode(),
                'execution_time' => microtime(true) - LARAVEL_START
            ]);

            // Switch back to master database
            DB::setDefaultConnection('mysql');
            Config::set('database.default', 'mysql');

            // Clear tenant from application context
            app()->forgetInstance('tenant');
        }
    }
}
