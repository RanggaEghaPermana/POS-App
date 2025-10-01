<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductPriceHistory;
use App\Models\AppSetting;
use App\Models\BusinessType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProductAdminController extends Controller
{
    public function index(Request $request)
    {
        $q = $request->query('q');
        $category = $request->query('category_id');
        $perPage = (int)min(100, max(1, $request->query('per_page', 20)));

        // Get current business type and filter products accordingly
        $businessTypeSlug = AppSetting::where('key', 'business_type')->value('value') ?? 'general';
        $businessType = BusinessType::where('slug', $businessTypeSlug)->first();

        $query = Product::with('category');

        // Filter by business type if available
        if ($businessType) {
            $query->where('business_type_id', $businessType->id);
        }

        $rows = $query->when($q, fn($qq) => $qq->where(function($w) use ($q){
                $w->where('name','like',"%{$q}%")->orWhere('sku','like',"%{$q}%");
            }))
            ->when($category, fn($qq) => $qq->where('category_id',$category))
            ->orderBy('name')
            ->paginate($perPage);
        return response()->json($rows);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required','string','max:255'],
            'sku' => ['required','string','max:100','unique:products,sku'],
            'category_id' => ['nullable','integer','exists:categories,id'],
            'price' => ['required','numeric','min:0'],
            'stock' => ['required','integer','min:0'],
            'active' => ['nullable','boolean'],
            'image' => ['nullable','image','max:4096'],
            'brand' => ['nullable','string','max:255'],
            'cost_price' => ['nullable','numeric','min:0'],
            'margin_percentage' => ['nullable','numeric','min:0','max:100'],
            'supplier' => ['nullable','string','max:255'],
            'unit_type' => ['nullable','string','max:50'],
            'weight' => ['nullable','string','max:100'],
            'dimensions' => ['nullable','string','max:255'],
            'expired_date' => ['nullable','date'],
            'minimum_stock' => ['nullable','integer','min:0'],
            'location' => ['nullable','string','max:255'],
            'tax_rate' => ['nullable','numeric','min:0','max:100'],
            'discount_percentage' => ['nullable','numeric','min:0','max:100'],
            'notes' => ['nullable','string','max:1000'],
            'dynamic_fields' => ['nullable','string']
        ]);
        $data['active'] = (bool)($data['active'] ?? true);

        // Handle dynamic fields
        if (isset($data['dynamic_fields']) && is_string($data['dynamic_fields'])) {
            $data['dynamic_fields'] = json_decode($data['dynamic_fields'], true) ?: [];
        }

        // Set business_type_id based on current business type
        $businessTypeSlug = AppSetting::where('key', 'business_type')->value('value') ?? 'general';
        $businessType = BusinessType::where('slug', $businessTypeSlug)->first();
        if ($businessType) {
            $data['business_type_id'] = $businessType->id;
        }

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('products','public');
            $data['image_path'] = $path;
        }
        $product = Product::create($data);
        ProductPriceHistory::create([
            'product_id' => $product->id,
            'old_price' => null,
            'new_price' => $product->price,
            'changed_by' => $request->user()?->id,
        ]);
        return response()->json($product, 201);
    }

    public function show($id)
    {
        $p = Product::with('category','priceHistories')->findOrFail($id);
        return response()->json($p);
    }

    public function update(Request $request, int $id)
    {
        $p = Product::findOrFail($id);
        $data = $request->validate([
            'name' => ['required','string','max:255'],
            'sku' => ['required','string','max:100','unique:products,sku,'.$p->id],
            'category_id' => ['nullable','integer','exists:categories,id'],
            'price' => ['required','numeric','min:0'],
            'stock' => ['required','integer','min:0'],
            'active' => ['nullable','boolean'],
            'image' => ['nullable','image','max:4096'],
            'brand' => ['nullable','string','max:255'],
            'cost_price' => ['nullable','numeric','min:0'],
            'margin_percentage' => ['nullable','numeric','min:0','max:100'],
            'supplier' => ['nullable','string','max:255'],
            'unit_type' => ['nullable','string','max:50'],
            'weight' => ['nullable','string','max:100'],
            'dimensions' => ['nullable','string','max:255'],
            'expired_date' => ['nullable','date'],
            'minimum_stock' => ['nullable','integer','min:0'],
            'location' => ['nullable','string','max:255'],
            'tax_rate' => ['nullable','numeric','min:0','max:100'],
            'discount_percentage' => ['nullable','numeric','min:0','max:100'],
            'notes' => ['nullable','string','max:1000'],
            'dynamic_fields' => ['nullable','string']
        ]);
        $data['active'] = (bool)($data['active'] ?? true);

        // Handle dynamic fields
        if (isset($data['dynamic_fields']) && is_string($data['dynamic_fields'])) {
            $data['dynamic_fields'] = json_decode($data['dynamic_fields'], true) ?: [];
        }

        $oldPrice = (float)$p->price;
        $oldImage = $p->image_path;
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('products','public');
            $data['image_path'] = $path;
        }
        $p->update($data);
        if ((float)$p->price !== $oldPrice) {
            ProductPriceHistory::create([
                'product_id' => $p->id,
                'old_price' => $oldPrice,
                'new_price' => $p->price,
                'changed_by' => $request->user()?->id,
            ]);
        }
        if (!empty($oldImage) && !empty($data['image_path']) && $oldImage !== $data['image_path']) {
            Storage::disk('public')->delete($oldImage);
        }
        return response()->json($p);
    }

    public function destroy(int $id)
    {
        $p = Product::findOrFail($id);
        $existsInSale = \App\Models\SaleItem::where('product_id',$p->id)->exists();
        if ($existsInSale) {
            return response()->json(['message' => 'Produk sudah memiliki histori penjualan.'], 422);
        }
        if ($p->image_path) {
            \Storage::disk('public')->delete($p->image_path);
        }
        $p->delete();
        return response()->json(['deleted' => true]);
    }

    public function barcode(int $id)
    {
        $product = Product::findOrFail($id);
        $code = $product->sku ?: (string)$product->id;
        if (!class_exists('Picqer\\Barcode\\BarcodeGeneratorPNG')) {
            abort(500, 'Barcode library missing');
        }
        $generator = new \Picqer\Barcode\BarcodeGeneratorPNG();
        $png = $generator->getBarcode($code, $generator::TYPE_CODE_128, 2, 60);
        return response($png)->header('Content-Type','image/png');
    }

    public function lowStock(\Illuminate\Http\Request $request)
    {
        $threshold = (int)($request->query('threshold', 10));
        $limit = (int)min(100, max(1, $request->query('limit', 20)));

        // Get current business type and filter products accordingly
        $businessTypeSlug = AppSetting::where('key', 'business_type')->value('value') ?? 'general';
        $businessType = BusinessType::where('slug', $businessTypeSlug)->first();

        $query = Product::with('category')
            ->where('stock', '<=', $threshold);

        // Filter by business type if available
        if ($businessType) {
            $query->where('business_type_id', $businessType->id);
        }

        $rows = $query->orderBy('stock')
            ->limit($limit)
            ->get();
        return response()->json($rows);
    }

    public function adjustStock(Request $request, int $id)
    {
        $product = Product::findOrFail($id);

        $data = $request->validate([
            'adjustment' => ['required', 'integer'],
            'reason' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string']
        ]);

        $oldStock = $product->stock;
        $newStock = max(0, $oldStock + $data['adjustment']);

        $product->update(['stock' => $newStock]);

        // Log stock movement (simplified approach)
        try {
            \App\Models\StockMovement::create([
                'product_id' => $product->id,
                'type' => 'adjustment',
                'quantity' => $data['adjustment'],
                'quantity_before' => $oldStock,
                'quantity_after' => $newStock,
                'reason' => $data['reason'],
                'notes' => $data['notes'] ?? null,
                'user_id' => $request->user()?->id,
                'tenant_id' => null, // Not using tenant system for this simple case
                'branch_id' => null, // Not using branch system for this simple case
            ]);
        } catch (\Exception $e) {
            // If stock movement logging fails, continue anyway
            \Log::warning('Failed to log stock movement: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'product' => $product->fresh(),
            'stock_change' => $newStock - $oldStock
        ]);
    }

    public function stockHistory(Request $request, $id = null)
    {
        $query = \App\Models\StockMovement::with(['product', 'user'])
            ->orderBy('created_at', 'desc');

        if ($id && is_numeric($id)) {
            $query->where('product_id', (int)$id);
        }

        $perPage = (int)min(100, max(1, $request->query('per_page', 20)));

        try {
            $movements = $query->paginate($perPage);
            return response()->json($movements);
        } catch (\Exception $e) {
            // If StockMovement table doesn't exist or has issues, return empty data
            \Log::warning('Stock history query failed: ' . $e->getMessage());
            return response()->json([
                'data' => [],
                'meta' => [
                    'current_page' => 1,
                    'per_page' => $perPage,
                    'total' => 0,
                    'last_page' => 1
                ]
            ]);
        }
    }

    public function lowStockAlerts(Request $request)
    {
        try {
            $threshold = (int)($request->query('threshold', 5));

            // Get current business type and filter products accordingly
            $businessTypeSlug = AppSetting::where('key', 'business_type')->value('value') ?? 'general';
            $businessType = BusinessType::where('slug', $businessTypeSlug)->first();

            $query = Product::with('category')
                ->where('stock', '<=', $threshold)
                ->where('active', true);

            // Filter by business type if available
            if ($businessType) {
                $query->where('business_type_id', $businessType->id);
            }

            $alerts = $query->orderBy('stock')
                ->get()
                ->map(function ($product) {
                    return [
                        'id' => $product->id,
                        'name' => $product->name,
                        'sku' => $product->sku,
                        'current_stock' => $product->stock,
                        'category' => $product->category?->name,
                        'status' => $product->stock == 0 ? 'out_of_stock' : 'low_stock',
                        'urgency' => $product->stock == 0 ? 'critical' : ($product->stock <= 2 ? 'high' : 'medium')
                    ];
                });

            return response()->json([
                'alerts' => $alerts,
                'total_alerts' => $alerts->count(),
                'critical_count' => $alerts->where('status', 'out_of_stock')->count(),
                'threshold' => $threshold
            ]);
        } catch (\Exception $e) {
            \Log::warning('Low stock alerts query failed: ' . $e->getMessage());
            return response()->json([
                'alerts' => [],
                'total_alerts' => 0,
                'critical_count' => 0,
                'threshold' => $request->query('threshold', 5)
            ]);
        }
    }
}
