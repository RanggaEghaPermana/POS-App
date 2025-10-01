<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Barber;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class BarberController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Barber::with('user');

        if ($request->has('active')) {
            $query->where('active', $request->boolean('active'));
        }

        if ($request->has('skill_level')) {
            $query->where('skill_level', $request->skill_level);
        }

        if ($request->has('day')) {
            $query->availableOnDay($request->day);
        }

        $barbers = $query->get();

        return response()->json([
            'success' => true,
            'data' => $barbers
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'specialties' => 'nullable|string',
            'commission_rate' => 'required|numeric|min:0|max:100',
            'working_days' => 'nullable|array',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'skill_level' => 'required|in:junior,senior,master',
            'notes' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $barber = Barber::create($request->all());
        $barber->load('user');

        return response()->json([
            'success' => true,
            'message' => 'Barber created successfully',
            'data' => $barber
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $barber = Barber::with('user', 'appointments')->find($id);

        if (!$barber) {
            return response()->json([
                'success' => false,
                'message' => 'Barber not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $barber
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $barber = Barber::find($id);

        if (!$barber) {
            return response()->json([
                'success' => false,
                'message' => 'Barber not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'specialties' => 'nullable|string',
            'commission_rate' => 'nullable|numeric|min:0|max:100',
            'working_days' => 'nullable|array',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i|after:start_time',
            'skill_level' => 'nullable|in:junior,senior,master',
            'active' => 'nullable|boolean',
            'notes' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $barber->update($request->all());
        $barber->load('user');

        return response()->json([
            'success' => true,
            'message' => 'Barber updated successfully',
            'data' => $barber
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $barber = Barber::find($id);

        if (!$barber) {
            return response()->json([
                'success' => false,
                'message' => 'Barber not found'
            ], 404);
        }

        $barber->delete();

        return response()->json([
            'success' => true,
            'message' => 'Barber deleted successfully'
        ]);
    }

    public function todaysAppointments($id)
    {
        $barber = Barber::find($id);

        if (!$barber) {
            return response()->json([
                'success' => false,
                'message' => 'Barber not found'
            ], 404);
        }

        $appointments = $barber->getTodaysAppointments();

        return response()->json([
            'success' => true,
            'data' => $appointments
        ]);
    }

    public function monthlyRevenue($id, Request $request)
    {
        $barber = Barber::find($id);

        if (!$barber) {
            return response()->json([
                'success' => false,
                'message' => 'Barber not found'
            ], 404);
        }

        $month = $request->get('month');
        $year = $request->get('year');
        $revenue = $barber->getMonthlyRevenue($month, $year);

        return response()->json([
            'success' => true,
            'data' => [
                'barber_id' => $id,
                'month' => $month ?? now()->month,
                'year' => $year ?? now()->year,
                'revenue' => $revenue,
                'formatted_revenue' => 'Rp ' . number_format($revenue, 0, ',', '.')
            ]
        ]);
    }
}
