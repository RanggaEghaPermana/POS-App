<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\SaleService;
use Illuminate\Http\Request;

class ReturnController extends Controller
{
    public function store(Request $request, SaleService $service)
    {
        $data = $request->validate([
            'sale_number' => ['required','string'],
            'items' => ['required','array','min:1'],
            'items.*.sale_item_id' => ['required','integer','exists:sale_items,id'],
            'items.*.qty' => ['required','integer','min:1'],
            'method' => ['required','string'],
            'reference' => ['nullable','string'],
            'reason' => ['nullable','string'],
        ]);

        try {
            $ret = $service->processReturn(
                $data['sale_number'],
                $data['items'],
                $data['method'],
                $data['reference'] ?? null,
                $data['reason'] ?? null,
                $request->user()?->id
            );
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Retur gagal', 'error' => $e->getMessage()], 422);
        }

        return response()->json([
            'number' => $ret->number,
            'sale_id' => $ret->sale_id,
            'total_refund' => (float)$ret->total_refund,
            'method' => $ret->method,
            'reference' => $ret->reference,
            'reason' => $ret->reason,
            'processed_by' => $ret->processed_by,
            'created_at' => $ret->created_at->toAtomString(),
        ]);
    }
}

