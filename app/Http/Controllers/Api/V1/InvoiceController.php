<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\CustomerInvoice;
use App\Models\Sale;
use App\Models\AppSetting;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'sale_id' => ['required','integer','exists:sales,id']
        ]);
        $sale = Sale::findOrFail($data['sale_id']);
        $existing = CustomerInvoice::where('sale_id', $sale->id)->first();
        if ($existing) return response()->json($this->resource($existing));
        $number = 'INV' . now()->format('YmdHis') . rand(10,99);
        $inv = CustomerInvoice::create([
            'sale_id' => $sale->id,
            'number' => $number,
            'date' => now(),
        ]);
        return response()->json($this->resource($inv), 201);
    }

    public function show(int $id)
    {
        $inv = CustomerInvoice::findOrFail($id);
        return response()->json($this->resource($inv));
    }

    protected function resource(CustomerInvoice $inv): array
    {
        $sale = Sale::with(['items.product','payments','cashier'])->findOrFail($inv->sale_id);
        $pairs = AppSetting::all()->pluck('value', 'key');
        $settings = [];
        foreach ($pairs as $k => $v) {
            $decoded = json_decode($v ?? '', true);
            $settings[$k] = $decoded === null ? $v : $decoded;
        }
        $store = $settings['store'] ?? [];
        $currency = $settings['currency'] ?? 'IDR';
        $tax = $settings['tax'] ?? ['enabled'=>false,'rate'=>0];
        $fx = $settings['fx'] ?? ['enabled'=>false,'target'=>'USD','rate'=>null];
        return [
            'id' => $inv->id,
            'number' => $inv->number,
            'date' => $inv->date->toAtomString(),
            'currency' => $currency,
            'fx' => $fx,
            'store' => [
                'name' => $store['name'] ?? config('app.name'),
                'address' => $store['address'] ?? null,
                'phone' => $store['phone'] ?? null,
                'email' => $store['email'] ?? null,
                'npwp' => $store['npwp'] ?? null,
                'logo_url' => $store['logo_url'] ?? null,
                'nib' => $store['nib'] ?? null,
            ],
            'tax' => $tax,
            'sale' => [
                'number' => $sale->number,
                'subtotal' => (float)$sale->subtotal,
                'discount' => (float)$sale->discount,
                'tax' => (float)$sale->tax,
                'grand_total' => (float)$sale->grand_total,
                'items' => $sale->items->map(fn($it)=>[
                    'name'=>$it->product->name,
                    'qty'=>(int)$it->quantity,
                    'unit_price'=>(float)$it->unit_price,
                    'subtotal'=>(float)$it->subtotal,
                ])->all(),
                'payments' => $sale->payments->map(fn($p)=>[
                    'method'=>$p->method,
                    'amount'=>(float)$p->amount,
                    'reference'=>$p->reference,
                ])->all(),
            ],
        ];
    }
}

