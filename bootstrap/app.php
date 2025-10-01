<?php

use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->api(prepend: [
            \Illuminate\Http\Middleware\HandleCors::class,
        ]);
        // Global middleware
        $middleware->append(\App\Http\Middleware\ActivityLogger::class);

        // Route middleware aliases (Spatie Permissions + Tenant)
        $middleware->alias([
            'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
            'business-hours' => \App\Http\Middleware\WithinBusinessHours::class,
            'tenant' => \App\Http\Middleware\TenantMiddleware::class,
            'tenant.access' => \App\Http\Middleware\EnsureTenantAccess::class,
            'optional-tenant' => \App\Http\Middleware\OptionalTenantMiddleware::class,
        ]);

        \Illuminate\Auth\Middleware\Authenticate::redirectUsing(function () {
            return null;
        });
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (AuthenticationException $e, $request) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }

            return null;
        });
    })->create();
