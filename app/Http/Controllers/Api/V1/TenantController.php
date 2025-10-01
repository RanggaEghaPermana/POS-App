<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class TenantController extends Controller
{
    public function index()
    {
        $tenants = Tenant::with(['users', 'branches'])
            ->paginate(10);

        return response()->json($tenants);
    }

    /**
     * Create new tenant with isolated database
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'business_type' => 'required|string|in:photocopy,barbershop,restaurant,retail,laundry,automotive,pharmacy,clinic,hospital,education,legal,consulting,electronics,general',
            'owner_name' => 'required|string|max:255',
            'owner_email' => 'required|email|unique:tenants,owner_email',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'plan' => 'nullable|in:free,basic,premium,enterprise'
        ]);

        try {
            $tenant = Tenant::createTenant($request->all());

            return response()->json([
                'message' => 'Tenant created successfully with isolated database',
                'tenant' => [
                    'slug' => $tenant->slug,
                    'name' => $tenant->name,
                    'business_type' => $tenant->business_type,
                    'subdomain' => $tenant->subdomain,
                    'database_name' => $tenant->database_name,
                    'plan' => $tenant->plan,
                    'trial_ends_at' => $tenant->trial_ends_at,
                    'status' => $tenant->status
                ],
                'access' => [
                    'subdomain_url' => "https://{$tenant->subdomain}." . config('app.domain'),
                    'api_header' => 'X-Tenant-Slug: ' . $tenant->slug,
                ]
            ], 201);

        } catch (\Exception $e) {
            \Log::error('Failed to create tenant: ' . $e->getMessage());

            return response()->json([
                'error' => 'Tenant creation failed',
                'message' => 'Unable to create tenant with isolated database'
            ], 500);
        }
    }

    public function show(Tenant $tenant)
    {
        $tenant->load(['users', 'branches']);
        return response()->json($tenant);
    }

    public function update(Request $request, Tenant $tenant)
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'domain' => ['sometimes', 'string', Rule::unique('tenants')->ignore($tenant->id)],
            'subdomain' => ['sometimes', 'string', Rule::unique('tenants')->ignore($tenant->id)],
            'status' => 'sometimes|in:active,inactive,suspended',
            'subscription_plan' => 'sometimes|string',
            'features' => 'sometimes|array',
            'settings' => 'sometimes|array',
        ]);

        $tenant->update($request->only([
            'name', 'domain', 'subdomain', 'status',
            'subscription_plan', 'features', 'settings'
        ]));

        return response()->json([
            'message' => 'Tenant updated successfully',
            'tenant' => $tenant,
        ]);
    }

    /**
     * Get current tenant info and usage stats
     */
    public function current(Request $request)
    {
        $tenant = app('tenant');

        if (!$tenant) {
            return response()->json([
                'error' => 'No tenant context',
                'message' => 'Request not associated with any tenant'
            ], 404);
        }

        $limits = $tenant->hasReachedLimits();

        return response()->json([
            'tenant' => [
                'slug' => $tenant->slug,
                'name' => $tenant->name,
                'business_type' => $tenant->business_type,
                'plan' => $tenant->plan,
                'status' => $tenant->status,
                'trial_ends_at' => $tenant->trial_ends_at,
                'subscription_expires_at' => $tenant->subscription_expires_at,
            ],
            'usage' => $limits,
            'database' => [
                'name' => $tenant->database_name,
                'status' => 'connected'
            ]
        ]);
    }

    /**
     * Delete tenant and completely destroy isolated database
     */
    public function destroy(Tenant $tenant)
    {
        try {
            // This will drop the entire database and user
            if ($tenant->dropDatabase()) {
                $tenant->delete();

                return response()->json([
                    'message' => 'Tenant and all data deleted successfully',
                    'warning' => 'All tenant data has been permanently destroyed'
                ]);
            } else {
                return response()->json([
                    'error' => 'Failed to delete tenant database'
                ], 500);
            }

        } catch (\Exception $e) {
            \Log::error('Failed to delete tenant: ' . $e->getMessage());

            return response()->json([
                'error' => 'Deletion failed'
            ], 500);
        }
    }

    public function extendTrial(Request $request, Tenant $tenant)
    {
        $request->validate([
            'days' => 'required|integer|min:1|max:90',
        ]);

        $tenant->update([
            'trial_ends_at' => now()->addDays($request->days),
        ]);

        return response()->json([
            'message' => 'Trial extended successfully',
            'tenant' => $tenant,
        ]);
    }

    public function setSubscription(Request $request, Tenant $tenant)
    {
        $request->validate([
            'subscription_plan' => 'required|string',
            'expires_at' => 'required|date|after:now',
            'features' => 'sometimes|array',
        ]);

        $tenant->update([
            'subscription_plan' => $request->subscription_plan,
            'subscription_expires_at' => $request->expires_at,
            'features' => $request->features ?? $tenant->features,
        ]);

        return response()->json([
            'message' => 'Subscription set successfully',
            'tenant' => $tenant,
        ]);
    }
}