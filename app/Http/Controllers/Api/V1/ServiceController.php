<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Service;
use App\Models\ServiceCategory;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    public function index(Request $request)
    {
        $query = Service::with('serviceCategory');

        if ($request->has('q')) {
            $query->where(function($q) use ($request) {
                $q->where('name', 'like', '%' . $request->q . '%')
                  ->orWhere('code', 'like', '%' . $request->q . '%');
            });
        }

        if ($request->has('category_id')) {
            $query->where('service_category_id', $request->category_id);
        }

        if ($request->has('active')) {
            $query->where('active', $request->boolean('active'));
        }

        $services = $query->orderBy('created_at', 'desc')
                         ->orderBy('name')
                         ->paginate($request->get('per_page', 15));

        return response()->json($services);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:services,code',
            'service_category_id' => 'required|exists:service_categories,id',
            'base_price' => 'required|numeric|min:0',
            'unit' => 'required|string|max:20',
            'description' => 'nullable|string',
            'pricing_tiers' => 'nullable|array',
            'pricing_tiers.*.min_qty' => 'required_with:pricing_tiers|integer|min:1',
            'pricing_tiers.*.price' => 'required_with:pricing_tiers|numeric|min:0',
            'estimated_duration' => 'nullable|integer|min:0',
            'requirements' => 'nullable|string',
            'active' => 'boolean',
            'pricing_mode' => 'nullable|in:fixed,barber,combined',
            'barber_id' => 'nullable|exists:barbers,id',
            'barber_rate' => 'nullable|numeric|min:0',
            'treatment_fee' => 'nullable|numeric|min:0',
        ]);

        $service = Service::create($request->all());

        return response()->json($service->load('serviceCategory'), 201);
    }

    public function show($id)
    {
        $service = Service::findOrFail($id);
        return response()->json($service->load('serviceCategory'));
    }

    public function update(Request $request, $id)
    {
        $service = Service::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:services,code,' . $service->id,
            'service_category_id' => 'required|exists:service_categories,id',
            'base_price' => 'required|numeric|min:0',
            'unit' => 'required|string|max:20',
            'description' => 'nullable|string',
            'pricing_tiers' => 'nullable|array',
            'pricing_tiers.*.min_qty' => 'required_with:pricing_tiers|integer|min:1',
            'pricing_tiers.*.price' => 'required_with:pricing_tiers|numeric|min:0',
            'estimated_duration' => 'nullable|integer|min:0',
            'requirements' => 'nullable|string',
            'active' => 'boolean',
            'pricing_mode' => 'nullable|in:fixed,barber,combined',
            'barber_id' => 'nullable|exists:barbers,id',
            'barber_rate' => 'nullable|numeric|min:0',
            'treatment_fee' => 'nullable|numeric|min:0',
        ]);

        $service->update($request->all());

        return response()->json($service->load('serviceCategory'));
    }

    public function destroy($id)
    {
        $service = Service::findOrFail($id);
        $service->delete();
        return response()->json(['message' => 'Service deleted successfully']);
    }

    public function destroyAll()
    {
        $count = Service::count();

        if ($count == 0) {
            return response()->json(['message' => 'No services to delete']);
        }

        // Use delete() instead of truncate() to handle foreign key constraints
        Service::query()->delete();

        return response()->json(['message' => "Successfully deleted {$count} services"]);
    }

    public function bulkPricing(Request $request)
    {
        $request->validate([
            'services' => 'required|array',
            'services.*.id' => 'required|exists:services,id',
            'services.*.quantity' => 'required|integer|min:1',
        ]);

        $results = [];
        foreach ($request->services as $serviceData) {
            $service = Service::find($serviceData['id']);
            $price = $service->getPriceForQuantity($serviceData['quantity']);

            $results[] = [
                'service_id' => $service->id,
                'name' => $service->name,
                'code' => $service->code,
                'quantity' => $serviceData['quantity'],
                'unit_price' => $price,
                'total_price' => $price * $serviceData['quantity'],
                'unit' => $service->unit,
            ];
        }

        return response()->json($results);
    }
}