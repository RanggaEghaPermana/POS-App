<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Barber extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'user_id',
        'specialty',
        'specialties',
        'hourly_rate',
        'commission_rate',
        'working_days',
        'start_time',
        'end_time',
        'skill_level',
        'rating',
        'total_ratings',
        'active',
        'notes',
    ];

    protected $casts = [
        'hourly_rate' => 'decimal:2',
        'commission_rate' => 'decimal:2',
        'working_days' => 'array',
        'rating' => 'decimal:2',
        'active' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }

    public function customers()
    {
        return $this->hasMany(CustomerProfile::class, 'preferred_barber_id');
    }

    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    public function scopeAvailableOnDay($query, $dayOfWeek)
    {
        return $query->whereJsonContains('working_days', $dayOfWeek);
    }

    public function scopeBySkillLevel($query, $skillLevel)
    {
        return $query->where('skill_level', $skillLevel);
    }

    public function getSpecialtiesArrayAttribute(): array
    {
        return $this->specialties ? array_map('trim', explode(',', $this->specialties)) : [];
    }

    public function setSpecialtiesArrayAttribute($value): void
    {
        $this->attributes['specialties'] = is_array($value) ? implode(',', $value) : $value;
    }

    public function isAvailableOn($dayOfWeek): bool
    {
        return in_array($dayOfWeek, $this->working_days ?? []);
    }

    public function updateRating($newRating): void
    {
        $totalRatings = $this->total_ratings ?? 0;
        $currentRating = $this->rating ?? 0;

        $newTotalRatings = $totalRatings + 1;
        $newAverageRating = (($currentRating * $totalRatings) + $newRating) / max(1, $newTotalRatings);

        $this->update([
            'rating' => round($newAverageRating, 2),
            'total_ratings' => $newTotalRatings,
        ]);
    }

    public function getTodaysAppointments()
    {
        return $this->appointments()
            ->whereDate('appointment_date', today())
            ->orderBy('start_time')
            ->get();
    }

    public function getMonthlyRevenue($month = null, $year = null)
    {
        return $this->appointments()
            ->whereMonth('appointment_date', $month ?? now()->month)
            ->whereYear('appointment_date', $year ?? now()->year)
            ->where('status', 'completed')
            ->sum('barber_commission');
    }

    public function worksOnDay(Carbon $date): bool
    {
        if (!$this->working_days || !is_array($this->working_days) || count($this->working_days) === 0) {
            return true;
        }

        $days = array_map('intval', $this->working_days ?? []);
        return in_array($date->dayOfWeek, $days, true);
    }

    public function isAvailableAt(Carbon $start, int $durationMinutes, ?int $ignoreAppointmentId = null): bool
    {
        if ($durationMinutes <= 0) {
            return false;
        }

        if (!$this->worksOnDay($start)) {
            return false;
        }

        $end = $start->copy()->addMinutes($durationMinutes);
        $shiftStart = $this->getShiftStartForDate($start);
        $shiftEnd = $this->getShiftEndForDate($start);

        if ($start->lt($shiftStart) || $end->gt($shiftEnd)) {
            return false;
        }

        $appointmentsQuery = $this->appointments()
            ->whereDate('appointment_date', $start->toDateString())
            ->whereNotIn('status', ['cancelled', 'no_show']);

        if ($ignoreAppointmentId) {
            $appointmentsQuery->where('id', '!=', $ignoreAppointmentId);
        }

        $appointments = $appointmentsQuery->get();

        foreach ($appointments as $appointment) {
            $appointmentDate = $appointment->appointment_date instanceof Carbon
                ? $appointment->appointment_date
                : Carbon::parse($appointment->appointment_date);

            $existingStart = $this->combineDateAndTime($appointmentDate, $appointment->start_time);
            $existingEnd = $this->combineDateAndTime($appointmentDate, $appointment->end_time);

            if ($existingStart < $end && $existingEnd > $start) {
                return false;
            }
        }

        return true;
    }

    public function getAvailableSlots(Carbon $date, int $durationMinutes, int $stepMinutes = 15, ?int $ignoreAppointmentId = null): array
    {
        $slots = [];

        if ($durationMinutes <= 0 || !$this->worksOnDay($date)) {
            return $slots;
        }

        $shiftStart = $this->getShiftStartForDate($date);
        $shiftEnd = $this->getShiftEndForDate($date);

        if ($shiftStart >= $shiftEnd) {
            return $slots;
        }

        $appointmentsQuery = $this->appointments()
            ->whereDate('appointment_date', $date->toDateString())
            ->whereNotIn('status', ['cancelled', 'no_show']);

        if ($ignoreAppointmentId) {
            $appointmentsQuery->where('id', '!=', $ignoreAppointmentId);
        }

        $appointments = $appointmentsQuery->get();

        $current = $shiftStart->copy();
        while ($current->copy()->addMinutes($durationMinutes) <= $shiftEnd) {
            $slotEnd = $current->copy()->addMinutes($durationMinutes);

            $conflict = $appointments->first(function (Appointment $appointment) use ($current, $slotEnd) {
                $appointmentDate = $appointment->appointment_date instanceof Carbon
                    ? $appointment->appointment_date
                    : Carbon::parse($appointment->appointment_date);

                $existingStart = $this->combineDateAndTime($appointmentDate, $appointment->start_time);
                $existingEnd = $this->combineDateAndTime($appointmentDate, $appointment->end_time);

                return $existingStart < $slotEnd && $existingEnd > $current;
            });

            if (!$conflict) {
                $slots[] = [
                    'start' => $current->format('H:i'),
                    'end' => $slotEnd->format('H:i'),
                    'label' => $current->format('H:i') . ' - ' . $slotEnd->format('H:i'),
                ];
            }

            $current->addMinutes($stepMinutes);
        }

        return $slots;
    }

    protected function getShiftStartForDate(Carbon $date): Carbon
    {
        return $this->combineDateAndTime($date, $this->start_time ?: '09:00:00');
    }

    protected function getShiftEndForDate(Carbon $date): Carbon
    {
        return $this->combineDateAndTime($date, $this->end_time ?: '18:00:00');
    }

    protected function combineDateAndTime(Carbon $date, ?string $time): Carbon
    {
        $time = $time ?: '00:00:00';
        $format = strlen($time) === 5 ? 'H:i' : 'H:i:s';
        $tz = config('app.timezone') ?: 'UTC';

        $dt = Carbon::createFromFormat($format, $time, $tz);

        return Carbon::create(
            $date->year,
            $date->month,
            $date->day,
            $dt->hour,
            $dt->minute,
            $dt->second,
            $tz
        );
    }
}

