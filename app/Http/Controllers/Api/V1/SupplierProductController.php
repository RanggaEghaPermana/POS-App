<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SupplierProduct;
use Illuminate\Http\Request;

class SupplierProductController extends Controller
{
    public function index(int $supplierId)
    {
        $rows = SupplierProduct::with('product')->where('supplier_id', $supplierId)->orderBy('id','desc')->get();
        return response()->json($rows);
    }

    public function upsert(Request $request, int $supplierId)
    {
        $data = $request->validate([
            'product_id' => ['required','integer','exists:products,id'],
            'supplier_sku' => ['nullable','string','max:255'],
            'cost_price' => ['nullable','numeric','min:0'],
            'lead_time_days' => ['nullable','integer','min:0']
        ]);
        $row = SupplierProduct::updateOrCreate(
            ['supplier_id' => $supplierId, 'product_id' => $data['product_id'] ],
            [
                'supplier_sku' => $data['supplier_sku'] ?? null,
                'cost_price' => $data['cost_price'] ?? null,
                'lead_time_days' => $data['lead_time_days'] ?? null,
            ]
        );
        return response()->json($row->load('product'));
    }

    public function destroy(int $supplierId, int $id)
    {
        $row = SupplierProduct::where('supplier_id',$supplierId)->findOrFail($id);
        $row->delete();
        return response()->json(['deleted' => true]);
    }
}

