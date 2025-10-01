<?php

namespace App\Http\Middleware;

use App\Models\ActivityLog;
use Closure;
use Illuminate\Http\Request;

class ActivityLogger
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        try {
            $user = $request->user();
            $action = $request->method().' '.$request->path();
            $ip = $request->ip();
            $meta = [
                'status' => $response->getStatusCode(),
                'route' => optional($request->route())->getName(),
            ];
            // Avoid logging sensitive fields
            $payload = $request->except(['password','token','authorization']);
            if (!empty($payload)) $meta['payload'] = $payload;
            ActivityLog::create([
                'user_id' => $user?->id,
                'action' => $action,
                'ip' => $ip,
                'meta' => json_encode($meta, JSON_UNESCAPED_UNICODE),
            ]);
        } catch (\Throwable $e) {
            // ignore
        }

        return $response;
    }
}

