<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use Illuminate\Http\Request;

class BranchController extends Controller
{
    public function index()
    {
        return response()->json(Branch::orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required','string','max:255'],
            'code' => ['required','string','max:50','unique:branches,code'],
            'address' => ['nullable','string','max:255']
        ]);
        $b = Branch::create($data);
        return response()->json($b, 201);
    }

    public function update(Request $request, int $id)
    {
        $b = Branch::findOrFail($id);
        $data = $request->validate([
            'name' => ['required','string','max:255'],
            'code' => ['required','string','max:50','unique:branches,code,'.$b->id],
            'address' => ['nullable','string','max:255']
        ]);
        $b->update($data);
        return response()->json($b);
    }

    public function destroy(int $id)
    {
        $b = Branch::findOrFail($id);
        $b->delete();
        return response()->json(['deleted'=>true]);
    }
}

