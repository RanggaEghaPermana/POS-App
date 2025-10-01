<?php

namespace App\Services;

use App\Models\Payment;
use App\Models\Product;
use App\Models\ReturnItem;
use App\Models\ReturnModel;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\PricingRule;
use Illuminate\Support\Facades\DB;
use App\Models\AppSetting;

class SaleService
{
    public function checkout(array $cartItems, float $discount = 0, float $tax = 0, array $payments = [], ?int $cashierId = null, ?int $branchId = null): Sale
    {
        $cart = [];
        foreach ($cartItems as $row) {
            $pid = (int)($row['product_id'] ?? 0);
            $qty = max(1, (int)($row['qty'] ?? 1));
            if ($pid <= 0 || $qty <= 0) continue;
            $product = Product::find($pid);
            if (!$product) continue;
            $finalPrice = $this->calculateFinalPrice($product);
            $cart[$pid] = [
                'product_id' => $product->id,
                'name' => $product->name,
                'price' => $finalPrice,
                'original_price' => (float)$product->price,
                'qty' => $qty,
            ];
        }
        if (empty($cart)) {
            throw new \InvalidArgumentException('Keranjang kosong.');
        }

        $subtotal = 0.0;
        foreach ($cart as $row) {
            $subtotal += $row['price'] * $row['qty'];
        }
        $rawGrand = max(0, $subtotal - $discount + $tax);
        // Apply rounding policy
        $policy = 'none';
        $mode = 'normal'; // normal | discount (round-down-only as discount)
        $pricing = AppSetting::where('key','pricing')->value('value');
        if ($pricing) {
            $decoded = json_decode($pricing, true);
            if (is_array($decoded)) {
                if (!empty($decoded['rounding'])) { $policy = (string)$decoded['rounding']; }
                if (!empty($decoded['rounding_mode'])) { $mode = (string)$decoded['rounding_mode']; }
            } elseif (is_string($pricing)) {
                $policy = (string)$pricing;
            }
        }

        $roundingAdjustment = 0.0;
        $grand = $rawGrand;
        if ($policy !== 'none') {
            if ($mode === 'discount') {
                // Round DOWN only, and treat the difference as discount (never increase customer pay)
                $step = $policy === 'nearest_1000' ? 1000 : 100;
                $roundedDown = floor($rawGrand / $step) * $step;
                $roundingAdjustment = $roundedDown - $rawGrand; // <= 0
                $grand = $roundedDown;
            } else {
                // normal rounding (nearest)
                $rounded = $this->roundAccordingToPolicy($rawGrand, $policy);
                $roundingAdjustment = $rounded - $rawGrand; // +/-
                $grand = $rounded;
            }
        }
        $paid = 0.0;
        $validPayments = [];
        foreach ($payments as $p) {
            if (!empty($p['method']) && isset($p['amount']) && (float)$p['amount'] > 0) {
                $validPayments[] = $p;
                $paid += (float)$p['amount'];
            }
        }
        if (empty($validPayments)) {
            throw new \InvalidArgumentException('Minimal satu pembayaran dengan nominal > 0.');
        }

        $change = max(0, $paid - $grand);
        $number = 'S' . now()->format('YmdHis') . rand(10, 99);

        // Snapshot FX settings
        $fxConf = json_decode((string)AppSetting::where('key','fx')->value('value'), true) ?: [];
        $fxEnabled = (bool)($fxConf['enabled'] ?? false);
        $fxTarget = (string)($fxConf['target'] ?? 'USD');
        $fxRate = (float)($fxConf['rate'] ?? 0);
        $fxTime = now();

        return DB::transaction(function () use ($number, $subtotal, $discount, $tax, $rawGrand, $roundingAdjustment, $policy, $mode, $grand, $paid, $change, $cashierId, $branchId, $cart, $validPayments, $fxEnabled, $fxTarget, $fxRate, $fxTime) {
            $sale = Sale::create([
                'number' => $number,
                'subtotal' => $subtotal,
                'discount' => $discount,
                'tax' => $tax,
                'rounding_adjustment' => $roundingAdjustment,
                'rounding_policy' => $policy,
                'rounding_mode' => $mode,
                'fx_target' => $fxEnabled && $fxRate > 0 ? $fxTarget : null,
                'fx_rate_used' => $fxEnabled && $fxRate > 0 ? $fxRate : null,
                'fx_timestamp' => $fxEnabled && $fxRate > 0 ? $fxTime : null,
                'grand_total' => $grand,
                'payment_status' => $paid >= $grand ? 'paid' : 'partial',
                'paid_amount' => $paid,
                'change_amount' => $change,
                'cashier_id' => $cashierId,
                'branch_id' => $branchId,
            ]);

            foreach ($cart as $pid => $row) {
                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $pid,
                    'quantity' => $row['qty'],
                    'unit_price' => $row['price'],
                    'subtotal' => $row['price'] * $row['qty'],
                ]);

                // Get current stock for logging
                $product = Product::find($pid);
                $oldStock = $product ? $product->stock : 0;
                $newStock = max(0, $oldStock - $row['qty']);

                // Per-branch stock
                if ($branchId) {
                    $ps = \App\Models\ProductStock::firstOrCreate(['branch_id'=>$branchId, 'product_id'=>$pid], ['stock'=>0]);
                    $ps->decrement('stock', $row['qty']);
                }
                // Legacy global stock fallback
                Product::where('id', $pid)->decrement('stock', $row['qty']);

                // Log stock movement
                try {
                    \App\Models\StockMovement::create([
                        'product_id' => $pid,
                        'type' => 'out',
                        'reason' => 'sale',
                        'quantity' => -$row['qty'],
                        'quantity_before' => $oldStock,
                        'quantity_after' => $newStock,
                        'unit_cost' => $row['original_price'],
                        'total_cost' => $row['original_price'] * $row['qty'],
                        'sale_id' => $sale->id,
                        'user_id' => $cashierId,
                        'tenant_id' => null,
                        'branch_id' => $branchId,
                        'notes' => "Penjualan #{$sale->number}",
                    ]);
                } catch (\Exception $e) {
                    // If stock movement logging fails, continue anyway
                    \Log::warning('Failed to log stock movement for sale: ' . $e->getMessage());
                }
            }

            foreach ($validPayments as $p) {
                Payment::create([
                    'sale_id' => $sale->id,
                    'method' => $p['method'],
                    'amount' => $p['amount'],
                    'reference' => $p['reference'] ?? null,
                    'paid_at' => now(),
                ]);
            }

            return $sale;
        });
    }

    public function processReturn(string $saleNumber, array $items, string $method, ?string $reference, ?string $reason, ?int $userId = null): ReturnModel
    {
        $sale = Sale::where('number', $saleNumber)->firstOrFail();
        $saleItems = SaleItem::whereIn('id', collect($items)->pluck('sale_item_id'))->get()->keyBy('id');

        return DB::transaction(function () use ($sale, $items, $method, $reference, $reason, $userId, $saleItems) {
            $retNumber = 'R' . now()->format('YmdHis') . rand(10, 99);
            $total = 0.0;
            $ret = ReturnModel::create([
                'number' => $retNumber,
                'sale_id' => $sale->id,
                'total_refund' => 0,
                'method' => $method,
                'reference' => $reference,
                'reason' => $reason,
                'processed_by' => $userId,
            ]);

            foreach ($items as $row) {
                $si = $saleItems[$row['sale_item_id']] ?? null;
                if (!$si) continue;
                $qty = min((int)$row['qty'], $si->quantity);
                if ($qty <= 0) continue;
                $line = $qty * (float)$si->unit_price;
                $total += $line;

                ReturnItem::create([
                    'return_id' => $ret->id,
                    'sale_item_id' => $si->id,
                    'quantity' => $qty,
                    'unit_price' => $si->unit_price,
                    'subtotal' => $line,
                ]);

                // Get current stock for logging
                $product = Product::find($si->product_id);
                $oldStock = $product ? $product->stock : 0;
                $newStock = $oldStock + $qty;

                Product::where('id', $si->product_id)->increment('stock', $qty);

                // Log stock movement for return
                try {
                    \App\Models\StockMovement::create([
                        'product_id' => $si->product_id,
                        'type' => 'in',
                        'reason' => 'return',
                        'quantity' => $qty,
                        'quantity_before' => $oldStock,
                        'quantity_after' => $newStock,
                        'unit_cost' => $si->unit_price,
                        'total_cost' => $si->unit_price * $qty,
                        'user_id' => $userId,
                        'tenant_id' => null,
                        'branch_id' => $sale->branch_id,
                        'notes' => "Retur barang dari penjualan #{$sale->number}, alasan: {$reason}",
                    ]);
                } catch (\Exception $e) {
                    // If stock movement logging fails, continue anyway
                    \Log::warning('Failed to log stock movement for return: ' . $e->getMessage());
                }
            }

            $ret->update(['total_refund' => $total]);
            return $ret;
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

    /**
     * Calculate final price for a product after applying active pricing rules
     */
    protected function calculateFinalPrice(Product $product): float
    {
        $originalPrice = (float)$product->price;
        $now = now();

        // Get active pricing rules for this product
        $rules = PricingRule::where('active', true)
            ->where(function($query) use ($now) {
                $query->whereNull('start_at')
                    ->orWhere('start_at', '<=', $now);
            })
            ->where(function($query) use ($now) {
                $query->whereNull('end_at')
                    ->orWhere('end_at', '>=', $now);
            })
            ->where(function($query) use ($product) {
                $query->where(function($subQuery) use ($product) {
                    $subQuery->whereNull('product_id')
                        ->whereNull('category_id');
                })
                ->orWhere('product_id', $product->id)
                ->orWhere('category_id', $product->category_id);
            })
            ->orderBy('created_at', 'desc')
            ->get();

        $finalPrice = $originalPrice;

        foreach ($rules as $rule) {
            // Skip if rule is for specific product/category and doesn't match
            if ($rule->product_id && $rule->product_id != $product->id) continue;
            if ($rule->category_id && $rule->category_id != $product->category_id) continue;

            if ($rule->type === 'percentage') {
                // Apply percentage discount
                $discount = $originalPrice * ($rule->value / 100);
                $finalPrice = max(0, $originalPrice - $discount);
            } elseif ($rule->type === 'fixed') {
                // Apply fixed price
                $finalPrice = (float)$rule->value;
            }

            // Apply only the first matching rule
            break;
        }

        return $finalPrice;
    }
}
