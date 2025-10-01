<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Service;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\AppSetting;

class ServiceCheckoutController extends Controller
{
    public function checkout(Request $request)
    {
        $request->validate([
            'service_items' => 'required|array|min:1',
            'service_items.*.service_id' => 'required|exists:services,id',
            'service_items.*.qty' => 'required|integer|min:1',
            'service_items.*.unit_price' => 'required|numeric|min:0',
            'service_items.*.notes' => 'nullable|string',
            'discount' => 'nullable|numeric|min:0',
            'tax' => 'nullable|numeric|min:0',
            'payments' => 'required|array|min:1',
            'payments.*.method' => 'required|in:cash,qris,transfer',
            'payments.*.amount' => 'required|numeric|min:0',
            'payments.*.reference' => 'nullable|string',
            'estimated_duration' => 'nullable|integer|min:0',
            'customer_name' => 'nullable|string|max:255',
            'customer_phone' => 'nullable|string|max:20',
            'barber_id' => 'nullable|string|max:50',
        ]);

        return DB::transaction(function () use ($request) {
            // Calculate totals
            $subtotal = 0;
            foreach ($request->service_items as $item) {
                $subtotal += $item['qty'] * $item['unit_price'];
            }

            $discount = (float)$request->input('discount', 0);
            $tax = (float)$request->input('tax', 0);
            $rawTotal = max(0, $subtotal - $discount + $tax);

            // Pricing rounding policy & mode
            $policy = 'none';
            $mode = 'normal'; // normal | discount
            $pricing = AppSetting::where('key','pricing')->value('value');
            if ($pricing) {
                $decoded = json_decode($pricing, true);
                if (is_array($decoded)) {
                    if (!empty($decoded['rounding'])) $policy = (string)$decoded['rounding'];
                    if (!empty($decoded['rounding_mode'])) $mode = (string)$decoded['rounding_mode'];
                } elseif (is_string($pricing)) {
                    $policy = (string)$pricing;
                }
            }

            $roundingAdjustment = 0.0;
            $total = $rawTotal;
            if ($policy !== 'none') {
                if ($mode === 'discount') {
                    // Always round down to step; treat difference as discount
                    $step = $policy === 'nearest_1000' ? 1000 : 100;
                    $roundedDown = floor($rawTotal / $step) * $step;
                    $roundingAdjustment = $roundedDown - $rawTotal; // <= 0
                    $total = $roundedDown;
                } else {
                    $rounded = $this->roundAccordingToPolicy($rawTotal, $policy);
                    $roundingAdjustment = $rounded - $rawTotal; // +/-
                    $total = $rounded;
                }
            }

            // Snapshot FX settings
            $fxConf = json_decode((string)AppSetting::where('key','fx')->value('value'), true) ?: [];
            $fxEnabled = (bool)($fxConf['enabled'] ?? false);
            $fxTarget = (string)($fxConf['target'] ?? 'USD');
            $fxRate = (float)($fxConf['rate'] ?? 0);
            $fxTime = now();

            // Validate payment amount
            $totalPayments = array_sum(array_column($request->payments, 'amount'));
            if ($totalPayments < $total) {
                return response()->json([
                    'message' => 'Total pembayaran kurang dari total tagihan'
                ], 422);
            }

            // Generate sale number
            $saleNumber = 'SRV-' . date('Ymd') . '-' . str_pad(
                Sale::whereDate('created_at', today())->count() + 1,
                4,
                '0',
                STR_PAD_LEFT
            );

            // Create sale record
            $sale = Sale::create([
                'number' => $saleNumber,
                'cashier_id' => auth()->id(),
                'subtotal' => $subtotal,
                'discount' => $discount,
                'tax' => $tax,
                'rounding_adjustment' => $roundingAdjustment,
                'rounding_policy' => $policy,
                'rounding_mode' => $mode,
                'fx_target' => $fxEnabled && $fxRate > 0 ? $fxTarget : null,
                'fx_rate_used' => $fxEnabled && $fxRate > 0 ? $fxRate : null,
                'fx_timestamp' => $fxEnabled && $fxRate > 0 ? $fxTime : null,
                'grand_total' => $total,
                'type' => 'service', // Mark as service transaction
                'estimated_duration' => $request->input('estimated_duration'),
                'branch_id' => $request->input('branch_id'),
                'payment_status' => 'paid',
                'paid_amount' => $totalPayments,
                'change_amount' => $totalPayments - $total,
                // Barbershop customer info
                'customer_name' => $request->input('customer_name'),
                'customer_phone' => $request->input('customer_phone'),
                'notes' => $request->input('barber_id') ? "Barber ID: {$request->input('barber_id')}" : null,
            ]);

            // Create sale items for services
            foreach ($request->service_items as $item) {
                $service = Service::find($item['service_id']);

                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => null, // No product for service
                    'service_id' => $item['service_id'], // Add service_id
                    'quantity' => $item['qty'],
                    'unit_price' => $item['unit_price'],
                    'subtotal' => $item['qty'] * $item['unit_price'],
                ]);
            }

            // Create payment records
            foreach ($request->payments as $payment) {
                if ($payment['amount'] > 0) {
                    Payment::create([
                        'sale_id' => $sale->id,
                        'method' => $payment['method'],
                        'amount' => $payment['amount'],
                        'reference' => $payment['reference'] ?? null,
                    ]);
                }
            }

            return response()->json([
                'message' => 'Service checkout berhasil',
                'sale' => $sale->load(['saleItems.service', 'payments']),
                'id' => $sale->id,
                'number' => $sale->number,
                'change' => $totalPayments - $total,
            ], 201);
        });
    }

    protected function roundAccordingToPolicy(float $amount, string $policy): float
    {
        switch ($policy) {
            case 'nearest_100':
                return round($amount / 100) * 100;
            case 'nearest_1000':
                return round($amount / 1000) * 1000;
            default:
                return $amount;
        }
    }
}
