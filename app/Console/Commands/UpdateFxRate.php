<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\AppSetting;

class UpdateFxRate extends Command
{
    protected $signature = 'fx:update {--target=USD} {--base=IDR}';
    protected $description = 'Update FX rate in settings (fx.rate) using exchangerate.host with fallback';

    public function handle(): int
    {
        $target = strtoupper((string)$this->option('target')) ?: 'USD';
        $base = strtoupper((string)$this->option('base')) ?: 'IDR';

        // Providers (ordered)
        $providers = [
            [
                'name' => 'exchangerate.host',
                'url' => "https://api.exchangerate.host/latest?base={$base}&symbols={$target}",
                'parse' => function($data) use ($target) {
                    return isset($data['rates'][$target]) ? (float)$data['rates'][$target] : 0;
                }
            ],
            [
                'name' => 'open.er-api.com',
                'url' => "https://open.er-api.com/v6/latest/{$base}",
                'parse' => function($data) use ($target) {
                    return isset($data['rates'][$target]) ? (float)$data['rates'][$target] : 0;
                }
            ],
        ];

        $rate = 0.0; $source = null;
        foreach ($providers as $p) {
            $this->info("Fetching FX rate {$base} -> {$target} from {$p['name']} ...");
            try {
                $json = $this->fetchJson($p['url']);
                if ($json) {
                    $parsed = $p['parse']($json);
                    if ($parsed > 0) { $rate = $parsed; $source = $p['name']; break; }
                }
            } catch (\Throwable $e) {
                $this->warn($p['name'].': '.$e->getMessage());
            }
        }

        if (!$rate || $rate <= 0) {
            $this->error('Unable to fetch FX rate. Keep current rate.');
            return self::FAILURE;
        }

        $fx = json_decode((string)AppSetting::where('key','fx')->value('value'), true) ?: [];
        $fx['enabled'] = (bool)($fx['enabled'] ?? true);
        $fx['target'] = $target;
        $fx['rate'] = $rate;
        $fx['updated_at'] = now()->toAtomString();
        $fx['source'] = $source;
        AppSetting::updateOrCreate(['key'=>'fx'], ['value'=>json_encode($fx, JSON_UNESCAPED_UNICODE)]);

        $this->info("Updated FX: 1 {$base} = {$rate} {$target} (source: {$source})");
        return self::SUCCESS;
    }

    protected function fetchJson(string $url): ?array
    {
        // Try cURL first
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
            $err = \curl_error($ch);
            $code = \curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
            \curl_close($ch);
            if ($resp !== false && $code >= 200 && $code < 300) {
                $data = json_decode($resp, true);
                if (is_array($data)) return $data;
            } else if ($err) {
                $this->warn('cURL error: '.$err);
            }
        }
        // Fallback to file_get_contents
        $ctx = stream_context_create(['http' => ['timeout' => 15], 'https' => ['timeout' => 15]]);
        $raw = @file_get_contents($url, false, $ctx);
        if ($raw !== false) {
            $data = json_decode($raw, true);
            if (is_array($data)) return $data;
        }
        return null;
    }
}
