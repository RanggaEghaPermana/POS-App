<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\BarbershopService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class BarbershopServiceController extends Controller
{
    public function index(Request $request)
    {
        $query = BarbershopService::query();

        if ($request->filled('active')) {
            $query->where('active', $request->boolean('active'));
        }

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        if ($request->filled('min_price')) {
            $query->where('price', '>=', (float) $request->min_price);
        }

        if ($request->filled('max_price')) {
            $query->where('price', '<=', (float) $request->max_price);
        }

        $services = $query->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => $services,
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'duration_minutes' => 'required|integer|min:1',
            'category' => 'required|string|max:100',
            'skill_level_required' => 'required|in:junior,senior,master',
            'image_url' => 'nullable|url',
            'active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        $service = BarbershopService::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Layanan berhasil dibuat',
            'data' => $service,
        ], 201);
    }

    public function show(string $id)
    {
        $service = BarbershopService::find($id);

        if (!$service) {
            return response()->json([
                'success' => false,
                'message' => 'Layanan tidak ditemukan',
            ], 404);
        }

        $service->appointments_count = Appointment::whereJsonContains('service_ids', (int) $id)
            ->whereNotIn('status', ['cancelled', 'no_show'])
            ->count();

        return response()->json([
            'success' => true,
            'data' => $service,
        ]);
    }

    public function update(Request $request, string $id)
    {
        $service = BarbershopService::find($id);

        if (!$service) {
            return response()->json([
                'success' => false,
                'message' => 'Layanan tidak ditemukan',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'description' => 'sometimes|nullable|string',
            'price' => 'sometimes|numeric|min:0',
            'duration_minutes' => 'sometimes|integer|min:1',
            'category' => 'sometimes|string|max:100',
            'skill_level_required' => 'sometimes|in:junior,senior,master',
            'image_url' => 'sometimes|nullable|url',
            'active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        $service->update($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Layanan berhasil diperbarui',
            'data' => $service,
        ]);
    }

    public function destroy(string $id)
    {
        $service = BarbershopService::find($id);

        if (!$service) {
            return response()->json([
                'success' => false,
                'message' => 'Layanan tidak ditemukan',
            ], 404);
        }

        $service->delete();

        return response()->json([
            'success' => true,
            'message' => 'Layanan berhasil dihapus',
        ]);
    }

    public function popularServices()
    {
        $services = BarbershopService::getPopularServices(10);

        return response()->json([
            'success' => true,
            'data' => $services,
        ]);
    }

    public function categories()
    {
        $categories = BarbershopService::select('category')
            ->distinct()
            ->where('active', true)
            ->pluck('category');

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }
}
