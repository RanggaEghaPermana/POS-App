<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\StaffSchedule;
use App\Models\User;
use Illuminate\Http\Request;

class StaffScheduleController extends Controller
{
    public function index(Request $request)
    {
        $tenant = app('tenant');
        $userId = $request->query('user_id');
        $q = StaffSchedule::query()
            ->with('user:id,name')
            ->when($tenant, fn($builder) => $builder->whereHas('user', fn($u) => $u->where('tenant_id', $tenant->id)));
        if ($userId) {
            $q->where('user_id', $userId);
        }
        return response()->json($q->orderBy('user_id')->orderBy('day_of_week')->get());
    }

    public function upsertForUser(Request $request, int $userId)
    {
        $tenant = app('tenant');
        $user = User::findOrFail($userId);

        if ($tenant && $user->tenant_id !== $tenant->id) {
            return response()->json(['message' => 'User berada di tenant lain'], 403);
        }

        $data = $request->validate([
            'schedules' => ['required','array'],
            'schedules.*.day_of_week' => ['required','integer','min:0','max:6'],
            'schedules.*.start_time' => ['required','date_format:H:i'],
            'schedules.*.end_time' => ['required','date_format:H:i'],
        ]);
        StaffSchedule::where('user_id',$user->id)->delete();
        foreach ($data['schedules'] as $s) {
            StaffSchedule::create([
                'user_id' => $user->id,
                'day_of_week' => (int)$s['day_of_week'],
                'start_time' => $s['start_time'].':00',
                'end_time' => $s['end_time'].':00',
            ]);
        }
        return response()->json(['updated' => true]);
    }
}
