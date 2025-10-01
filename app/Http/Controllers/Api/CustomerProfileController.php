<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CustomerProfile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CustomerProfileController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = CustomerProfile::with('user');

        if ($request->has('gender')) {
            $query->where('gender', $request->gender);
        }

        if ($request->has('preferred_barber_id')) {
            $query->where('preferred_barber_id', $request->preferred_barber_id);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $profiles = $query->get();

        return response()->json([
            'success' => true,
            'data' => $profiles
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id|unique:customer_profiles,user_id',
            'phone_number' => 'nullable|string|max:20',
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|in:male,female,other',
            'address' => 'nullable|string',
            'preferred_barber_id' => 'nullable|exists:barbers,id',
            'hair_type' => 'nullable|string|max:100',
            'skin_type' => 'nullable|string|max:100',
            'allergies' => 'nullable|string',
            'notes' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $profile = CustomerProfile::create($request->all());
        $profile->load('user', 'preferredBarber.user');

        return response()->json([
            'success' => true,
            'message' => 'Customer profile created successfully',
            'data' => $profile
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $profile = CustomerProfile::with(['user', 'preferredBarber.user', 'appointments.service'])->find($id);

        if (!$profile) {
            return response()->json([
                'success' => false,
                'message' => 'Customer profile not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $profile
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $profile = CustomerProfile::find($id);

        if (!$profile) {
            return response()->json([
                'success' => false,
                'message' => 'Customer profile not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'phone_number' => 'nullable|string|max:20',
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|in:male,female,other',
            'address' => 'nullable|string',
            'preferred_barber_id' => 'nullable|exists:barbers,id',
            'hair_type' => 'nullable|string|max:100',
            'skin_type' => 'nullable|string|max:100',
            'allergies' => 'nullable|string',
            'notes' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $profile->update($request->all());
        $profile->load('user', 'preferredBarber.user');

        return response()->json([
            'success' => true,
            'message' => 'Customer profile updated successfully',
            'data' => $profile
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $profile = CustomerProfile::find($id);

        if (!$profile) {
            return response()->json([
                'success' => false,
                'message' => 'Customer profile not found'
            ], 404);
        }

        $profile->delete();

        return response()->json([
            'success' => true,
            'message' => 'Customer profile deleted successfully'
        ]);
    }

    public function getByUser(string $userId)
    {
        $profile = CustomerProfile::with(['user', 'preferredBarber.user', 'appointments.service'])
            ->where('user_id', $userId)
            ->first();

        if (!$profile) {
            return response()->json([
                'success' => false,
                'message' => 'Customer profile not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $profile
        ]);
    }

    public function appointmentHistory(string $id)
    {
        $profile = CustomerProfile::find($id);

        if (!$profile) {
            return response()->json([
                'success' => false,
                'message' => 'Customer profile not found'
            ], 404);
        }

        $appointments = $profile->appointments()
            ->with(['barber.user', 'service'])
            ->orderBy('appointment_datetime', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'customer' => $profile->user->name,
                'total_appointments' => $appointments->count(),
                'appointments' => $appointments
            ]
        ]);
    }

    public function stats(string $id)
    {
        $profile = CustomerProfile::find($id);

        if (!$profile) {
            return response()->json([
                'success' => false,
                'message' => 'Customer profile not found'
            ], 404);
        }

        $stats = [
            'total_appointments' => $profile->appointments()->count(),
            'completed_appointments' => $profile->appointments()->where('status', 'completed')->count(),
            'cancelled_appointments' => $profile->appointments()->where('status', 'cancelled')->count(),
            'total_spent' => $profile->appointments()->where('status', 'completed')->sum('total_price'),
            'favorite_service' => $profile->appointments()
                ->select('service_id')
                ->groupBy('service_id')
                ->orderByRaw('COUNT(*) DESC')
                ->with('service')
                ->first()?->service,
            'average_rating_given' => $profile->appointments()
                ->whereNotNull('customer_rating')
                ->avg('customer_rating')
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'customer' => $profile->user->name,
                'stats' => $stats
            ]
        ]);
    }
}
