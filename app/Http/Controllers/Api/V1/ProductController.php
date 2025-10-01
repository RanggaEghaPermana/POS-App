<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\AppSetting;
use App\Models\BusinessType;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $q = $request->query('q');
        $pageSize = (int)($request->query('per_page', 20));
        $pageSize = max(1, min(100, $pageSize));
        $branchId = $request->query('branch_id');

        // Get current business type and filter products accordingly
        $businessTypeSlug = AppSetting::where('key', 'business_type')->value('value') ?? 'general';
        $businessType = BusinessType::where('slug', $businessTypeSlug)->first();

        $query = Product::query()->where('active', true);

        // Filter by business type if available
        if ($businessType) {
            $query->where('business_type_id', $businessType->id);
        }

        $query->when($q, fn($qq) => $qq->where(function($w) use ($q){
                $w->where('name','like',"%{$q}%")->orWhere('sku','like',"%{$q}%");
            }))
            ->orderBy('name');

        $products = $query->paginate($pageSize);
        $products->getCollection()->transform(function ($p) {
            return [
                'id' => $p->id,
                'name' => $p->name,
                'sku' => $p->sku,
                'price' => (float)$p->price,
                'stock' => (int)$p->stock,
                'image_url' => $p->image_path ? asset('storage/'.$p->image_path) : null,
            ];
        });
        // If branch specified, map stock from product_stocks
        if ($branchId) {
            $ids = $products->getCollection()->pluck('id')->all();
            $stocks = \App\Models\ProductStock::where('branch_id',$branchId)->whereIn('product_id',$ids)->pluck('stock','product_id');
            $products->getCollection()->transform(function($row) use ($stocks){
                $row['stock'] = (int)($stocks[$row['id']] ?? 0);
                return $row;
            });
        }
        return response()->json($products);
    }
}
