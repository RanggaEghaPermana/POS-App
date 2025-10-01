<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\StockTransfer;
use App\Models\StockTransferItem;
use Illuminate\Http\Request;

class StockTransferController extends Controller
{
    public function index(Request $request)
    {
        $status = $request->query('status');
        $q = $request->query('q');
        $rows = StockTransfer::query()
            ->when($status, fn($qq) => $qq->where('status',$status))
            ->when($q, fn($qq) => $qq->where('number','like',"%{$q}%"))
            ->latest()
            ->paginate((int)min(100, max(1, $request->query('per_page', 15))));
        return response()->json($rows);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'from_location' => ['nullable','string','max:255'],
            'to_location' => ['nullable','string','max:255'],
            'from_branch_id' => ['nullable','integer','exists:branches,id'],
            'to_branch_id' => ['nullable','integer','exists:branches,id'],
            'notes' => ['nullable','string']
        ]);
        $number = 'TF' . now()->format('YmdHis') . rand(10,99);
        $tf = StockTransfer::create([
            'number' => $number,
            'status' => 'draft',
            'from_location' => $data['from_location'] ?? null,
            'to_location' => $data['to_location'] ?? null,
            'from_branch_id' => $data['from_branch_id'] ?? null,
            'to_branch_id' => $data['to_branch_id'] ?? null,
            'notes' => $data['notes'] ?? null,
            'created_by' => $request->user()?->id,
        ]);
        return response()->json($tf, 201);
    }

    public function show(int $id)
    {
        $tf = StockTransfer::with('items.product')->findOrFail($id);
        return response()->json($tf);
    }

    public function addItem(Request $request, int $id)
    {
        $tf = StockTransfer::findOrFail($id);
        if ($tf->status !== 'draft') return response()->json(['message'=>'Hanya draft yang dapat diubah'], 422);
        $data = $request->validate([
            'product_id' => ['nullable','integer','exists:products,id'],
            'sku' => ['nullable','string'],
            'quantity' => ['required','integer','min:1'],
            'note' => ['nullable','string'],
        ]);
        $product = null;
        if (!empty($data['product_id'])) {
            $product = Product::find($data['product_id']);
        } elseif (!empty($data['sku'])) {
            $product = Product::where('sku',$data['sku'])->first();
        }
        if (!$product) return response()->json(['message'=>'Produk tidak ditemukan'], 404);

        $item = StockTransferItem::create([
            'stock_transfer_id' => $tf->id,
            'product_id' => $product->id,
            'quantity' => (int)$data['quantity'],
            'note' => $data['note'] ?? null,
        ]);
        return response()->json($item->load('product'));
    }

    public function updateItem(Request $request, int $id, int $itemId)
    {
        $tf = StockTransfer::findOrFail($id);
        if ($tf->status !== 'draft') return response()->json(['message'=>'Hanya draft yang dapat diubah'], 422);
        $item = StockTransferItem::where('stock_transfer_id',$id)->findOrFail($itemId);
        $data = $request->validate([
            'quantity' => ['required','integer','min:1'],
            'note' => ['nullable','string']
        ]);
        $item->update($data);
        return response()->json($item->load('product'));
    }

    public function setStatus(Request $request, int $id)
    {
        $tf = StockTransfer::with('items')->findOrFail($id);
        $data = $request->validate([
            'status' => ['required','in:draft,approved,shipped,received,cancelled']
        ]);
        $from = $tf->status;
        $to = $data['status'];
        $allowed = [
            'draft' => ['approved','cancelled'],
            'approved' => ['shipped','cancelled'],
            'shipped' => ['received'],
            'received' => [],
            'cancelled' => [],
        ];
        if (!in_array($to, $allowed[$from] ?? [])) {
            return response()->json(['message' => "Transisi status dari {$from} ke {$to} tidak diizinkan"], 422);
        }
        $payload = ['status' => $to];
        if ($to === 'approved') $payload['approved_by'] = $request->user()?->id;
        if ($to === 'shipped') {
            $payload['shipped_at'] = now();
            if ($tf->from_branch_id) {
                foreach ($tf->items as $it) {
                    $ps = \App\Models\ProductStock::firstOrCreate(['branch_id'=>$tf->from_branch_id,'product_id'=>$it->product_id], ['stock'=>0]);
                    $ps->decrement('stock', $it->quantity);
                }
            }
        }
        if ($to === 'received') {
            $payload['received_at'] = now();
            if ($tf->to_branch_id) {
                foreach ($tf->items as $it) {
                    $ps = \App\Models\ProductStock::firstOrCreate(['branch_id'=>$tf->to_branch_id,'product_id'=>$it->product_id], ['stock'=>0]);
                    $ps->increment('stock', $it->quantity);
                }
            }
        }
        $tf->update($payload);
        return response()->json($tf->fresh('items'));
    }
}
