<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ServiceCategory;
use Illuminate\Http\Request;

class ServiceCategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = ServiceCategory::query();

        if ($request->has('q')) {
            $query->where('name', 'like', '%' . $request->q . '%');
        }

        if ($request->has('active')) {
            $query->where('active', $request->boolean('active'));
        }

        $categories = $query->withCount('services')
                          ->orderBy('name')
                          ->paginate($request->get('per_page', 15));

        return response()->json($categories);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:100',
            'color' => 'nullable|string|max:7',
            'active' => 'boolean',
        ]);

        $category = ServiceCategory::create($request->all());

        return response()->json($category, 201);
    }

    public function show($id)
    {
        $serviceCategory = ServiceCategory::findOrFail($id);
        return response()->json($serviceCategory->load('services'));
    }

    public function update(Request $request, ServiceCategory $serviceCategory)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:100',
            'color' => 'nullable|string|max:7',
            'active' => 'boolean',
        ]);

        $serviceCategory->update($request->all());

        return response()->json($serviceCategory);
    }

    public function destroy($id)
    {
        $serviceCategory = ServiceCategory::findOrFail($id);

        if ($serviceCategory->services()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete category with existing services'
            ], 422);
        }

        $serviceCategory->delete();

        return response()->json(['message' => 'Service category deleted successfully']);
    }

    public function destroyAll()
    {
        $count = ServiceCategory::count();

        if ($count == 0) {
            return response()->json(['message' => 'No service categories to delete']);
        }

        // Use delete() instead of truncate() to handle foreign key constraints
        ServiceCategory::query()->delete();

        return response()->json(['message' => "Successfully deleted {$count} service categories"]);
    }
}