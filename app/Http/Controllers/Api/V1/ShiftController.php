<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Shift;
use App\Models\StaffSchedule;
use Illuminate\Http\Request;
use Carbon\Carbon;

class ShiftController extends Controller
{
    public function index(Request $request)
    {
        $tenant = app('tenant');

        $query = Shift::with('user:id,name')
            ->when($tenant, fn($q) => $q->whereHas('user', fn($u) => $u->where('tenant_id', $tenant->id)))
            ->orderBy('started_at', 'desc');

        if ($request->user_id) {
            $query->where('user_id', $request->user_id);
        }

        $shifts = $query->paginate(20);
        return response()->json($shifts);
    }

    public function active(Request $request)
    {
        // For setup routes without authentication, return latest active shift
        if (!$request->user()) {
            $activeShift = Shift::where('status', 'active')
                ->latest()
                ->first();
            return response()->json($activeShift ?? []);
        }

        // For authenticated routes, get user-specific active shift
        $activeShift = Shift::where('user_id', $request->user()->id)
            ->where('status', 'active')
            ->first();

        return response()->json($activeShift);
    }

    public function start(Request $request)
    {
        try {
            $user = $request->user();

            // Check if user already has active shift
            $existingShift = Shift::where('user_id', $user->id)
                ->where('status', 'active')
                ->first();

            if ($existingShift) {
                return response()->json([
                    'message' => 'Anda sudah memiliki shift aktif'
                ], 400);
            }

            // Check if user can start shift based on schedule
            $canStart = Shift::canUserStartShift($user);

            if (!$canStart['can_start']) {
                return response()->json([
                    'message' => $canStart['message'],
                    'can_start' => false
                ], 403);
            }
        } catch (\Exception $e) {
            \Log::error('Error in shift start validation: ' . $e->getMessage());
            return response()->json([
                'message' => 'Server error: ' . $e->getMessage()
            ], 500);
        }

        try {
            $data = $request->validate([
                'opening_balance' => ['numeric', 'min:0'],
                'notes' => ['nullable', 'string']
            ]);

            $now = now();
            $schedule = $canStart['schedule'] ?? null;

            // Calculate scheduled times if schedule exists
            $scheduledStart = null;
            $scheduledEnd = null;

            if ($schedule) {
                $today = $now->startOfDay();
                $scheduledStart = $today->copy()->addHours(
                    Carbon::createFromFormat('H:i:s', $schedule->start_time)->hour
                )->addMinutes(
                    Carbon::createFromFormat('H:i:s', $schedule->start_time)->minute
                );

                $scheduledEnd = $today->copy()->addHours(
                    Carbon::createFromFormat('H:i:s', $schedule->end_time)->hour
                )->addMinutes(
                    Carbon::createFromFormat('H:i:s', $schedule->end_time)->minute
                );
            }

            $shift = Shift::create([
                'user_id' => $user->id,
                'opening_balance' => $data['opening_balance'] ?? 0,
                'started_at' => $now,
                'scheduled_start' => $scheduledStart,
                'scheduled_end' => $scheduledEnd,
                'notes' => $data['notes'] ?? null,
                'status' => 'active'
            ]);

            return response()->json([
                'message' => 'Shift berhasil dimulai',
                'shift' => $shift,
                'schedule_info' => $canStart['message']
            ]);
        } catch (\Exception $e) {
            \Log::error('Error creating shift: ' . $e->getMessage());
            return response()->json([
                'message' => 'Gagal membuat shift: ' . $e->getMessage()
            ], 500);
        }
    }

    public function end(Request $request, $id)
    {
        try {
            $user = $request->user();

            // Find active shift for this user
            $shift = Shift::where('id', $id)
                ->where('user_id', $user->id)
                ->where('status', 'active')
                ->first();

            if (!$shift) {
                return response()->json([
                    'message' => 'Shift aktif tidak ditemukan untuk user ini'
                ], 404);
            }

            $data = $request->validate([
                'closing_balance' => ['required', 'numeric', 'min:0'],
                'notes' => ['nullable', 'string']
            ]);

            $now = now();
            $shift->update([
                'ended_at' => $now,
                'closing_balance' => $data['closing_balance'],
                'expected_closing' => $shift->opening_balance, // TODO: Calculate from sales
                'cash_difference' => $data['closing_balance'] - $shift->opening_balance,
                'status' => 'ended',
                'notes' => $data['notes'] ?? null
            ]);

            // Check if shift is ended outside schedule
            $outsideSchedule = false;
            if ($shift->scheduled_end && $now->gt($shift->scheduled_end)) {
                $outsideSchedule = true;
            }

            return response()->json([
                'message' => 'Shift berhasil ditutup',
                'shift' => $shift->fresh(),
                'outside_schedule' => $outsideSchedule,
                'schedule_info' => $outsideSchedule ?
                    'Shift ditutup di luar jam jadwal yang ditentukan' :
                    'Shift ditutup sesuai jadwal'
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Data tidak valid',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error ending shift: ' . $e->getMessage());
            return response()->json([
                'message' => 'Gagal menutup shift: ' . $e->getMessage()
            ], 500);
        }
    }

    public function checkSchedule(Request $request)
    {
        $user = $request->user();
        $canStart = Shift::canUserStartShift($user);

        return response()->json($canStart);
    }

    public function show($id)
    {
        $tenant = app('tenant');
        $shift = Shift::with('user:id,name')
            ->when($tenant, fn($q) => $q->whereHas('user', fn($u) => $u->where('tenant_id', $tenant->id)))
            ->findOrFail($id);
        return response()->json($shift);
    }
}
