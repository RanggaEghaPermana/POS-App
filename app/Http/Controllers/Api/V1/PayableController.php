<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\VendorInvoice;
use App\Models\VendorPayment;
use Illuminate\Http\Request;

class PayableController extends Controller
{
    public function index(Request $request)
    {
        $status = $request->query('status');
        $supplierId = $request->query('supplier_id');
        $q = $request->query('q');
        $rows = VendorInvoice::with('supplier')
            ->when($status, fn($qq) => $qq->where('status',$status))
            ->when($supplierId, fn($qq) => $qq->where('supplier_id',$supplierId))
            ->when($q, fn($qq) => $qq->where('number','like',"%{$q}%"))
            ->latest()
            ->paginate((int)min(100, max(1, $request->query('per_page', 20))));
        return response()->json($rows);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'supplier_id' => ['required','integer','exists:suppliers,id'],
            'number' => ['required','string','max:255','unique:vendor_invoices,number'],
            'date' => ['required','date'],
            'due_date' => ['nullable','date'],
            'total' => ['required','numeric','min:0'],
            'tax_amount' => ['nullable','numeric','min:0'],
            'notes' => ['nullable','string'],
        ]);
        $vi = VendorInvoice::create($data + ['status' => 'unpaid', 'tax_amount' => (float)($data['tax_amount'] ?? 0)]);
        return response()->json($vi, 201);
    }

    public function show(int $id)
    {
        $vi = VendorInvoice::with('supplier','payments')->findOrFail($id);
        return response()->json($vi);
    }

    public function addPayment(Request $request, int $id)
    {
        $vi = VendorInvoice::findOrFail($id);
        $data = $request->validate([
            'amount' => ['required','numeric','min:0.01'],
            'method' => ['required','string'],
            'reference' => ['nullable','string'],
            'paid_at' => ['nullable','date']
        ]);
        $payment = VendorPayment::create([
            'vendor_invoice_id' => $vi->id,
            'amount' => $data['amount'],
            'method' => $data['method'],
            'reference' => $data['reference'] ?? null,
            'paid_at' => $data['paid_at'] ?? now(),
        ]);
        $totalPaid = (float)$vi->paid_total + (float)$data['amount'];
        $status = $totalPaid >= (float)$vi->total ? 'paid' : 'partial';
        $vi->update(['paid_total' => $totalPaid, 'status' => $status]);
        return response()->json($vi->fresh('payments'));
    }
}
