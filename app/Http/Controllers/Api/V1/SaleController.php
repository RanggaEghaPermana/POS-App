<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Services\SaleService;
use Illuminate\Http\Request;

class SaleController extends Controller
{
    public function index(Request $request)
    {
        $q = $request->query('q');
        $from = $request->query('from');
        $to = $request->query('to');
        $cashierId = $request->query('cashier_id');
        $perPage = (int)min(100, max(1, $request->query('per_page', 15)));

        $type = $request->query('type');

        $query = Sale::query()
            ->when($q, fn($qq) => $qq->where('number','like',"%{$q}%"))
            ->when($from, fn($qq) => $qq->whereDate('created_at','>=',$from))
            ->when($to, fn($qq) => $qq->whereDate('created_at','<=',$to))
            ->when($cashierId, fn($qq) => $qq->where('cashier_id',$cashierId))
            ->when($type, fn($qq) => $qq->where('type', $type));

        // Cashier can only see own transactions
        if ($request->user()?->hasRole('cashier')) {
            $query->where('cashier_id', $request->user()->id);
        }

        $rows = $query->latest()->paginate($perPage);

        return response()->json($rows);
    }

    public function findByNumber(Request $request)
    {
        $number = $request->query('number');
        if (!$number) {
            return response()->json(['message' => 'number parameter required'], 422);
        }
        $sale = Sale::where('number', $number)->first();
        if (!$sale) return response()->json(['message' => 'Sale not found'], 404);
        if ($request->user()?->hasRole('cashier') && $sale->cashier_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        return response()->json($this->saleResource($sale->id));
    }
    public function checkout(Request $request, SaleService $service)
    {
        $data = $request->validate([
            'items' => ['required','array','min:1'],
            'items.*.product_id' => ['required','integer','exists:products,id'],
            'items.*.qty' => ['required','integer','min:1'],
            'discount' => ['nullable','numeric','min:0'],
            'tax' => ['nullable','numeric','min:0'],
            'payments' => ['required','array','min:1'],
            'payments.*.method' => ['nullable','string'],
            'payments.*.amount' => ['nullable','numeric','min:0'],
            'payments.*.reference' => ['nullable','string'],
            'branch_id' => ['nullable','integer','exists:branches,id'],
        ]);

        try {
            $sale = $service->checkout(
                $data['items'],
                (float)($data['discount'] ?? 0),
                (float)($data['tax'] ?? 0),
                $data['payments'] ?? [],
                $request->user()?->id,
                $data['branch_id'] ?? null
            );
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Checkout gagal', 'error' => $e->getMessage()], 422);
        }

        return response()->json($this->saleResource($sale->id));
    }

    public function show(int $id)
    {
        $sale = Sale::findOrFail($id);
        if (request()->user()?->hasRole('cashier') && $sale->cashier_id !== request()->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        return response()->json($this->saleResource($id));
    }

    protected function saleResource(int $id): array
    {
        $sale = Sale::with(['items.product','payments','cashier'])->findOrFail($id);
        return [
            'id' => $sale->id,
            'number' => $sale->number,
            'date' => $sale->created_at->toAtomString(),
            'subtotal' => (float)$sale->subtotal,
            'discount' => (float)$sale->discount,
            'tax' => (float)$sale->tax,
            'rounding_adjustment' => (float)($sale->rounding_adjustment ?? 0),
            'rounding_policy' => $sale->rounding_policy,
            'rounding_mode' => $sale->rounding_mode,
            'fx_rate_used' => $sale->fx_rate_used !== null ? (float)$sale->fx_rate_used : null,
            'fx_target' => $sale->fx_target,
            'fx_timestamp' => optional($sale->fx_timestamp)->toAtomString(),
            'grand_total' => (float)$sale->grand_total,
            'paid_amount' => (float)$sale->paid_amount,
            'change_amount' => (float)$sale->change_amount,
            'payment_status' => $sale->payment_status,
            'cashier' => $sale->cashier ? ['id'=>$sale->cashier->id,'name'=>$sale->cashier->name] : null,
            'items' => $sale->items->map(function($it){
                return [
                    'id' => $it->id,
                    'product_id' => $it->product_id,
                    'product_name' => $it->product->name,
                    'sku' => $it->product->sku,
                    'qty' => (int)$it->quantity,
                    'unit_price' => (float)$it->unit_price,
                    'subtotal' => (float)$it->subtotal,
                ];
            })->all(),
            'payments' => $sale->payments->map(function($p){
                return [
                    'method' => $p->method,
                    'amount' => (float)$p->amount,
                    'reference' => $p->reference,
                    'paid_at' => optional($p->paid_at)->toAtomString(),
                ];
            })->all(),
        ];
    }
}
