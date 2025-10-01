<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AppSetting;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function show()
    {
        $pairs = AppSetting::all()->pluck('value', 'key');
        $settings = [];
        foreach ($pairs as $k => $v) {
            $settings[$k] = $this->decode($v);
        }
        // defaults
        $settings += [
            'store' => [
                'name' => config('app.name'),
                'business_hours' => '09:00-21:00',
                'address' => null,
                'phone' => null,
                'email' => null,
                'npwp' => null,
                'logo_url' => null,
                'nib' => null,
            ],
            'currency' => 'IDR',
            'pricing' => [ 'rounding' => 'none', 'rounding_mode' => 'normal' ],
            'branding' => [ 'primary_color' => '#475569' ],
            'tax' => [ 'enabled' => false, 'rate' => 0 ],
            'receipt' => [ 'footer' => '' ],
            'fx' => [ 'enabled' => false, 'target' => 'USD', 'rate' => null ],
            'printer' => [ 'type' => 'thermal', 'width' => 58 ],
        ];
        return response()->json($settings);
    }

    public function update(Request $request)
    {
        $data = $request->all();
        foreach ($data as $key => $val) {
            AppSetting::updateOrCreate(['key' => $key], ['value' => $this->encode($val)]);
        }
        return $this->show();
    }

    public function fxSync(Request $request)
    {
        // Determine base currency (store currency) and target (requested or stored)
        $settings = AppSetting::all()->pluck('value','key');
        $currency = $settings['currency'] ?? null;
        $base = $currency ? (string)json_decode($currency, true) : 'IDR';
        if (!$base) $base = 'IDR';
        $fx = $settings['fx'] ?? null;
        $fxArr = $fx ? (json_decode($fx, true) ?: []) : [];
        $target = strtoupper((string)($request->input('target') ?: ($fxArr['target'] ?? 'USD')));

        [$rate, $source] = $this->fetchFxRate($base, $target);
        if (!$rate || $rate <= 0) {
            return response()->json(['message' => 'Gagal mengambil kurs'], 502);
        }

        $fxArr['enabled'] = (bool)($fxArr['enabled'] ?? true);
        $fxArr['target'] = $target;
        $fxArr['rate'] = $rate;
        $fxArr['updated_at'] = now()->toAtomString();
        $fxArr['source'] = $source;
        AppSetting::updateOrCreate(['key'=>'fx'], ['value'=>json_encode($fxArr, JSON_UNESCAPED_UNICODE)]);

        return response()->json(['fx' => $fxArr]);
    }

    protected function fetchFxRate(string $base, string $target): array
    {
        $providers = [
            [
                'name' => 'exchangerate.host',
                'url' => "https://api.exchangerate.host/latest?base={$base}&symbols={$target}",
                'parse' => function($data) use ($target) { return isset($data['rates'][$target]) ? (float)$data['rates'][$target] : 0; }
            ],
            [
                'name' => 'open.er-api.com',
                'url' => "https://open.er-api.com/v6/latest/{$base}",
                'parse' => function($data) use ($target) { return isset($data['rates'][$target]) ? (float)$data['rates'][$target] : 0; }
            ],
        ];
        foreach ($providers as $p) {
            try {
                $json = $this->fetchJson($p['url']);
                if ($json) {
                    $rate = $p['parse']($json);
                    if ($rate > 0) return [$rate, $p['name']];
                }
            } catch (\Throwable $e) {
                // Continue to next provider
            }
        }
        return [0, null];
    }

    protected function fetchJson(string $url): ?array
    {
        if (function_exists('curl_init')) {
            $ch = \curl_init($url);
            \curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_CONNECTTIMEOUT => 10,
                CURLOPT_TIMEOUT => 15,
                CURLOPT_SSL_VERIFYPEER => true,
            ]);
            $resp = \curl_exec($ch);
            $code = \curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
            \curl_close($ch);
            if ($resp !== false && $code >= 200 && $code < 300) {
                $data = json_decode($resp, true);
                if (is_array($data)) return $data;
            }
        }
        $ctx = stream_context_create(['http' => ['timeout' => 15], 'https' => ['timeout' => 15]]);
        $raw = @file_get_contents($url, false, $ctx);
        if ($raw !== false) {
            $data = json_decode($raw, true);
            if (is_array($data)) return $data;
        }
        return null;
    }

    protected function encode($val): string
    {
        return json_encode($val, JSON_UNESCAPED_UNICODE);
    }

    protected function decode(?string $val)
    {
        if ($val === null) return null;
        $decoded = json_decode($val, true);
        return $decoded === null ? $val : $decoded;
    }
}
