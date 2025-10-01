<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    public function index(Request $request)
    {
        $q = $request->query('q');
        $rows = Supplier::query()
            ->when($q, fn($qq) => $qq->where('name','like',"%{$q}%"))
            ->orderBy('name')
            ->paginate((int)min(100, max(1, $request->query('per_page', 20))));
        return response()->json($rows);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required','string','max:255'],
            'contact_name' => ['nullable','string','max:255'],
            'phone' => ['nullable','string','max:255'],
            'email' => ['nullable','string','max:255'],
            'address' => ['nullable','string','max:255'],
            'payment_terms' => ['nullable','string','max:255'],
            'rating' => ['nullable','integer','min:1','max:5'],
            'notes' => ['nullable','string'],
            'contract_url' => ['nullable','string','max:255'],
            'contract_expires_at' => ['nullable','date'],
        ]);
        $s = Supplier::create($data);
        return response()->json($s, 201);
    }

    public function show(int $id)
    {
        $s = Supplier::with('products.product')->findOrFail($id);
        return response()->json($s);
    }

    public function update(Request $request, int $id)
    {
        $s = Supplier::findOrFail($id);
        $data = $request->validate([
            'name' => ['required','string','max:255'],
            'contact_name' => ['nullable','string','max:255'],
            'phone' => ['nullable','string','max:255'],
            'email' => ['nullable','string','max:255'],
            'address' => ['nullable','string','max:255'],
            'payment_terms' => ['nullable','string','max:255'],
            'rating' => ['nullable','integer','min:1','max:5'],
            'notes' => ['nullable','string'],
            'contract_url' => ['nullable','string','max:255'],
            'contract_expires_at' => ['nullable','date'],
        ]);
        $s->update($data);
        return response()->json($s);
    }

    public function destroy(int $id)
    {
        $s = Supplier::findOrFail($id);
        if ($s->invoices()->exists()) {
            return response()->json(['message' => 'Supplier memiliki hutang/invoice dan tidak bisa dihapus.'], 422);
        }
        $s->delete();
        return response()->json(['deleted' => true]);
    }
}
