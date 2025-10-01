<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Shift extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'opening_balance', 'closing_balance', 'expected_closing',
        'cash_difference', 'started_at', 'ended_at', 'scheduled_start',
        'scheduled_end', 'status', 'notes', 'reconciliation_data'
    ];

    protected $casts = [
        'opening_balance' => 'decimal:2',
        'closing_balance' => 'decimal:2',
        'expected_closing' => 'decimal:2',
        'cash_difference' => 'decimal:2',
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
        'scheduled_start' => 'datetime',
        'scheduled_end' => 'datetime',
        'reconciliation_data' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function sales()
    {
        return $this->hasMany(Sale::class);
    }

    public function isActive()
    {
        return $this->status === 'active';
    }

    public function isOutsideSchedule()
    {
        if (!$this->scheduled_start || !$this->scheduled_end) {
            return false; // No schedule means no restrictions
        }

        $now = now();
        return $now->lt($this->scheduled_start) || $now->gt($this->scheduled_end);
    }

    /**
     * Check if current time is within today's staff schedule for this user
     */
    public static function canUserStartShift(User $user)
    {
        $today = now()->dayOfWeek; // 0=Sunday, 6=Saturday
        $currentTime = now()->format('H:i');

        $schedule = StaffSchedule::where('user_id', $user->id)
            ->where('day_of_week', $today)
            ->first();

        if (!$schedule) {
            // Check if user has ANY schedule at all
            $hasAnySchedule = StaffSchedule::where('user_id', $user->id)->exists();

            if ($hasAnySchedule) {
                // User has schedules for other days, but not today
                return [
                    'can_start' => false,
                    'message' => 'Tidak ada jadwal kerja untuk hari ini. Shift tidak dapat dibuka.'
                ];
            } else {
                // User has no schedules at all, allow unrestricted access
                return [
                    'can_start' => true,
                    'message' => 'Tidak ada pembatasan jadwal untuk user ini'
                ];
            }
        }

        $startTime = Carbon::createFromFormat('H:i:s', $schedule->start_time)->format('H:i');
        $endTime = Carbon::createFromFormat('H:i:s', $schedule->end_time)->format('H:i');

        if ($currentTime < $startTime || $currentTime > $endTime) {
            return [
                'can_start' => false,
                'message' => "Shift hanya bisa dibuka antara {$startTime} - {$endTime}",
                'schedule' => $schedule
            ];
        }

        return [
            'can_start' => true,
            'message' => 'Dalam jam kerja yang dijadwalkan',
            'schedule' => $schedule
        ];
    }
}
