<?php

namespace App\Http\Middleware;

use App\Models\AppSetting;
use Closure;
use Illuminate\Http\Request;

class WithinBusinessHours
{
    public function handle(Request $request, Closure $next)
    {
        if ($request->user()?->hasRole('super_admin') || $request->user()?->hasRole('admin') || $request->user()?->hasRole('manager')) {
            return $next($request);
        }

        $store = AppSetting::where('key','store')->value('value');
        $hours = '09:00-21:00';
        if ($store) {
            $decoded = json_decode($store, true);
            if (is_array($decoded) && !empty($decoded['business_hours'])) {
                $hours = (string)$decoded['business_hours'];
            }
        }

        [$start, $end] = $this->parseHours($hours);
        $now = now()->format('H:i:s');
        $within = $this->isWithin($now, $start, $end);
        if (!$within) {
            return response()->json([
                'message' => 'Di luar jam operasional',
                'business_hours' => $hours,
            ], 423);
        }
        return $next($request);
    }

    protected function parseHours(string $hours): array
    {
        $parts = explode('-', str_replace(' ', '', $hours));
        $start = $parts[0] ?? '09:00';
        $end = $parts[1] ?? '21:00';
        $start = strlen($start) === 5 ? $start.':00' : $start;
        $end = strlen($end) === 5 ? $end.':00' : $end;
        return [$start, $end];
    }

    protected function isWithin(string $time, string $start, string $end): bool
    {
        if ($start <= $end) return $time >= $start && $time <= $end;
        return $time >= $start || $time <= $end; // overnight
    }
}
