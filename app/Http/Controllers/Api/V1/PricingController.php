<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PricingRule;
use App\Models\Product;
use Illuminate\Http\Request;

class PricingController extends Controller
{
    public function rulesIndex(Request $request)
    {
        $rows = PricingRule::query()->latest()->paginate((int)min(100, max(1, $request->query('per_page', 20))));
        return response()->json($rows);
    }

    public function rulesStore(Request $request)
    {
        $data = $request->validate([
            'name' => ['required','string','max:255'],
            'type' => ['required','in:percentage,fixed'],
            'value' => ['required','numeric'],
            'product_id' => ['nullable','integer','exists:products,id'],
            'category_id' => ['nullable','integer','exists:categories,id'],
            'start_at' => ['nullable','date'],
            'end_at' => ['nullable','date'],
            'active' => ['nullable','boolean']
        ]);
        $row = PricingRule::create($data + ['active' => (bool)($data['active'] ?? true)]);
        return response()->json($row, 201);
    }

    public function rulesUpdate(Request $request, int $id)
    {
        $row = PricingRule::findOrFail($id);
        $data = $request->validate([
            'name' => ['required','string','max:255'],
            'type' => ['required','in:percentage,fixed'],
            'value' => ['required','numeric'],
            'product_id' => ['nullable','integer','exists:products,id'],
            'category_id' => ['nullable','integer','exists:categories,id'],
            'start_at' => ['nullable','date'],
            'end_at' => ['nullable','date'],
            'active' => ['nullable','boolean']
        ]);
        $row->update($data + ['active' => (bool)($data['active'] ?? true)]);
        return response()->json($row);
    }

    public function rulesDestroy(int $id)
    {
        $row = PricingRule::findOrFail($id);
        $row->delete();
        return response()->json(['deleted' => true]);
    }

    public function bulkUpdate(Request $request)
    {
        $data = $request->validate([
            'category_id' => ['nullable','integer','exists:categories,id'],
            'product_ids' => ['nullable','array'],
            'product_ids.*' => ['integer','exists:products,id'],
            'operation' => ['required','in:increase,decrease,set'],
            'amount' => ['required','numeric'],
            'mode' => ['required','in:percentage,fixed']
        ]);
        $q = Product::query();
        if (!empty($data['category_id'])) $q->where('category_id', $data['category_id']);
        if (!empty($data['product_ids'])) $q->whereIn('id', $data['product_ids']);
        $count = 0;
        foreach ($q->cursor() as $p) {
            $old = (float)$p->price;
            $new = $old;
            if ($data['mode'] === 'percentage') {
                $delta = $old * ($data['amount'] / 100);
                $new = $data['operation'] === 'increase' ? $old + $delta : ($data['operation'] === 'decrease' ? max(0, $old - $delta) : $old);
            } else {
                $new = $data['operation'] === 'set' ? $data['amount'] : ($data['operation'] === 'increase' ? $old + $data['amount'] : max(0, $old - $data['amount']));
            }
            if ($new !== $old) {
                $p->update(['price' => $new]);
                $count++;
            }
        }
        return response()->json(['updated' => $count]);
    }

    public function bulkPreview(Request $request)
    {
        $data = $request->validate([
            'category_id' => ['nullable','integer','exists:categories,id'],
            'product_ids' => ['nullable','array'],
            'product_ids.*' => ['integer','exists:products,id'],
            'operation' => ['required','in:increase,decrease,set'],
            'amount' => ['required','numeric'],
            'mode' => ['required','in:percentage,fixed']
        ]);

        $q = Product::query();
        if (!empty($data['category_id'])) $q->where('category_id', $data['category_id']);
        if (!empty($data['product_ids'])) $q->whereIn('id', $data['product_ids']);

        $products = [];
        foreach ($q->limit(20)->get() as $p) {
            $old = (float)$p->price;
            $new = $old;
            if ($data['mode'] === 'percentage') {
                $delta = $old * ($data['amount'] / 100);
                $new = $data['operation'] === 'increase' ? $old + $delta : ($data['operation'] === 'decrease' ? max(0, $old - $delta) : $old);
            } else {
                $new = $data['operation'] === 'set' ? $data['amount'] : ($data['operation'] === 'increase' ? $old + $data['amount'] : max(0, $old - $data['amount']));
            }

            $products[] = [
                'id' => $p->id,
                'name' => $p->name,
                'current_price' => $old,
                'new_price' => $new
            ];
        }

        $totalCount = $q->count();
        return response()->json([
            'count' => $totalCount,
            'products' => $products
        ]);
    }

    public function testPricing(Request $request)
    {
        $productId = $request->query('product_id');
        if (!$productId) {
            return response()->json(['message' => 'product_id required'], 422);
        }

        $product = Product::find($productId);
        if (!$product) {
            return response()->json(['message' => 'Product not found'], 404);
        }

        $originalPrice = (float)$product->price;
        $now = now();

        // Get all pricing rules for debugging
        $allRules = PricingRule::all();
        $activeRules = PricingRule::where('active', true)->get();

        // Get rules that match this product
        $matchingRules = PricingRule::where('active', true)
            ->where(function($query) use ($now) {
                $query->whereNull('start_at')
                    ->orWhere('start_at', '<=', $now);
            })
            ->where(function($query) use ($now) {
                $query->whereNull('end_at')
                    ->orWhere('end_at', '>=', $now);
            })
            ->where(function($query) use ($product) {
                $query->where(function($subQuery) {
                    $subQuery->whereNull('product_id')
                        ->whereNull('category_id');
                })
                ->orWhere('product_id', $product->id)
                ->orWhere('category_id', $product->category_id);
            })
            ->get();

        $finalPrice = $originalPrice;
        $appliedRule = null;

        foreach ($matchingRules as $rule) {
            if ($rule->product_id && $rule->product_id != $product->id) continue;
            if ($rule->category_id && $rule->category_id != $product->category_id) continue;

            if ($rule->type === 'percentage') {
                $discount = $originalPrice * ($rule->value / 100);
                $finalPrice = max(0, $originalPrice - $discount);
            } elseif ($rule->type === 'fixed') {
                $finalPrice = (float)$rule->value;
            }

            $appliedRule = $rule;
            break;
        }

        return response()->json([
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'category_id' => $product->category_id,
                'original_price' => $originalPrice
            ],
            'pricing_debug' => [
                'current_time' => $now->toDateTimeString(),
                'all_rules_count' => $allRules->count(),
                'active_rules_count' => $activeRules->count(),
                'matching_rules_count' => $matchingRules->count(),
                'all_rules' => $allRules,
                'matching_rules' => $matchingRules,
                'applied_rule' => $appliedRule,
                'final_price' => $finalPrice
            ]
        ]);
    }
}

