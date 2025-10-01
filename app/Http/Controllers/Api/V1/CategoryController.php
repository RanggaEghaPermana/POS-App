<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\AppSetting;
use App\Models\BusinessType;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $q = $request->query('q');

        // Get current business type and filter categories accordingly
        $businessTypeSlug = AppSetting::where('key', 'business_type')->value('value') ?? 'general';
        $businessType = BusinessType::where('slug', $businessTypeSlug)->first();

        $query = Category::query();

        // Filter by business type if available
        if ($businessType) {
            $query->where('business_type_id', $businessType->id);
        }

        $cats = $query->when($q, fn($qq) => $qq->where('name','like',"%{$q}%"))
            ->orderBy('name')
            ->paginate((int)min(100, max(1, $request->query('per_page', 20))));
        return response()->json($cats);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required','string','max:255'],
            'icon' => ['nullable','string','max:100']
        ]);

        // Set business_type_id based on current business type
        $businessTypeSlug = AppSetting::where('key', 'business_type')->value('value') ?? 'general';
        $businessType = BusinessType::where('slug', $businessTypeSlug)->first();
        if ($businessType) {
            $data['business_type_id'] = $businessType->id;
        }

        $cat = Category::create($data);
        return response()->json($cat, 201);
    }

    public function show(int $id)
    {
        $cat = Category::findOrFail($id);
        return response()->json($cat);
    }

    public function update(Request $request, int $id)
    {
        $cat = Category::findOrFail($id);
        $data = $request->validate([
            'name' => ['required','string','max:255'],
            'icon' => ['nullable','string','max:100']
        ]);
        $cat->update($data);
        return response()->json($cat);
    }

    public function destroy(int $id)
    {
        $cat = Category::findOrFail($id);
        $cat->delete();
        return response()->json(['deleted' => true]);
    }

    public function destroyAll(Request $request)
    {
        // Get current business type
        $businessTypeSlug = AppSetting::where('key', 'business_type')->value('value') ?? 'general';
        $businessType = BusinessType::where('slug', $businessTypeSlug)->first();

        $query = Category::query();

        // Filter by business type if available (only delete categories for current business type)
        if ($businessType) {
            $query->where('business_type_id', $businessType->id);
        }

        $deletedCount = $query->count();
        $query->delete();

        return response()->json([
            'deleted' => true,
            'count' => $deletedCount,
            'message' => "Berhasil menghapus {$deletedCount} kategori"
        ]);
    }
}

