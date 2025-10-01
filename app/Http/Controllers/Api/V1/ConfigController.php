<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\AppSetting;
use Illuminate\Support\Facades\Log;

class ConfigController extends Controller
{
    public function show(Request $request)
    {
        // Compose safe public config. Admin-only details remain in /settings
        try {
            $pairs = AppSetting::query()->get()->pluck('value', 'key');
        } catch (\Throwable $e) {
            Log::warning('Unable to load app settings; using defaults', ['error' => $e->getMessage()]);
            $pairs = collect();
        }

        $settings = [];
        foreach ($pairs as $k => $v) {
            $decoded = json_decode($v ?? '', true);
            $settings[$k] = $decoded === null ? $v : $decoded;
        }

        $store = $settings['store'] ?? [];
        if (!is_array($store)) {
            $store = [];
        }
        // Ensure base fields present
        $store += [
            'name' => config('app.name'),
            'business_hours' => '09:00-21:00',
        ];

        $receipt = $settings['receipt'] ?? [];
        if (!is_array($receipt)) {
            $receipt = [];
        }
        $receipt += ['footer' => ''];

        $currency = $settings['currency'] ?? config('app.currency', 'IDR');
        $pricing = $settings['pricing'] ?? ['rounding' => 'none', 'rounding_mode' => 'normal'];
        if (!is_array($pricing)) {
            $pricing = ['rounding' => (string) $pricing, 'rounding_mode' => 'normal'];
        }
        $branding = $settings['branding'] ?? ['primary_color' => '#475569'];
        $fx = $settings['fx'] ?? ['enabled' => false, 'target' => 'USD', 'rate' => null];
        $businessType = $settings['business_type'] ?? 'general';

        return response()->json([
            'payment_methods' => ['cash', 'qris', 'transfer'],
            'currency' => $currency,
            'store' => [
                'name' => $store['name'] ?? config('app.name'),
                'url' => config('app.url'),
                'business_hours' => $store['business_hours'] ?? '09:00-21:00',
                // Additional fields if present in settings (used by receipt header)
                'address' => $store['address'] ?? null,
                'phone' => $store['phone'] ?? null,
                'email' => $store['email'] ?? null,
                'npwp' => $store['npwp'] ?? null,
                'logo_url' => $store['logo_url'] ?? null,
                'nib' => $store['nib'] ?? null,
            ],
            'receipt' => [
                'footer' => $receipt['footer'] ?? '',
            ],
            'pricing' => [
                'rounding' => $pricing['rounding'] ?? 'none',
                'rounding_mode' => $pricing['rounding_mode'] ?? 'normal',
            ],
            'branding' => ['primary_color' => $branding['primary_color'] ?? '#475569'],
            'fx' => [
                'enabled' => (bool) ($fx['enabled'] ?? false),
                'target' => $fx['target'] ?? 'USD',
                'rate' => $fx['rate'] ?? null,
            ],
            'business_type' => $businessType,
        ]);
    }

    public function updateBusinessType(Request $request)
    {
        $request->validate([
            'business_type' => 'required|string|in:photocopy,barbershop,restaurant,retail,laundry,automotive,pharmacy,clinic,hospital,education,legal,consulting,electronics,general'
        ]);

        $businessType = $request->input('business_type');

        // Save business type to app settings
        AppSetting::updateOrCreate(
            ['key' => 'business_type'],
            ['value' => $businessType]
        );

        return response()->json([
            'message' => 'Business type updated successfully',
            'business_type' => $businessType,
        ]);
    }
}
