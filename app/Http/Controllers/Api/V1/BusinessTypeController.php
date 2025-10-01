<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\BusinessType;
use Illuminate\Http\Request;

class BusinessTypeController extends Controller
{
    public function index()
    {
        $businessTypes = BusinessType::where('active', true)
            ->select('id', 'name', 'slug', 'description', 'icon', 'color',
                    'supports_inventory', 'supports_services', 'supports_bookings',
                    'supports_tables', 'supports_appointments')
            ->orderBy('name')
            ->get();

        return response()->json($businessTypes);
    }

    public function show($slug)
    {
        $businessType = BusinessType::where('slug', $slug)
            ->where('active', true)
            ->first();

        if (!$businessType) {
            return response()->json(['message' => 'Business type not found'], 404);
        }

        return response()->json([
            'business_type' => $businessType,
            'product_fields' => $businessType->form_fields,
            'service_fields' => $businessType->getServiceFieldsConfig(),
        ]);
    }

    public function getFormFields($slug)
    {
        $businessType = BusinessType::where('slug', $slug)
            ->where('active', true)
            ->first();

        if (!$businessType) {
            return response()->json(['message' => 'Business type not found'], 404);
        }

        return response()->json([
            'product_fields' => $businessType->form_fields,
            'service_fields' => $businessType->supports_services ? $businessType->getServiceFieldsConfig() : [],
        ]);
    }

    public function getCurrentBusinessType(Request $request)
    {
        // Get current tenant's business type
        $tenant = $request->user()->currentTenant ?? null;

        if (!$tenant || !$tenant->business_type_id) {
            // Default to retail if no business type set
            $businessType = BusinessType::where('slug', 'retail')->first();
        } else {
            $businessType = $tenant->businessType;
        }

        if (!$businessType) {
            // Gracefully handle installations without seeded business types
            $fallback = new BusinessType([
                'slug' => 'retail',
                'name' => 'Retail',
                'supports_services' => false,
            ]);

            return response()->json([
                'business_type' => $fallback->only(['slug', 'name']),
                'product_fields' => $fallback->form_fields,
                'service_fields' => [],
            ]);
        }

        return response()->json([
            'business_type' => $businessType,
            'product_fields' => $businessType->form_fields,
            'service_fields' => $businessType->supports_services ? $businessType->getServiceFieldsConfig() : [],
        ]);
    }
}
