<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Appointment extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_name',
        'customer_phone',
        'barber_id',
        'service_ids',
        'appointment_date',
        'start_time',
        'end_time',
        'status',
        'notes',
        'total_duration',
        'total_price',
        'barber_commission',
        'before_photo',
        'after_photo',
        'customer_rating',
        'customer_feedback',
        'checked_in_at',
        'completed_at',
    ];

    protected $casts = [
        'service_ids' => 'array',
        'appointment_date' => 'date',
        'start_time' => 'string',
        'end_time' => 'string',
        'total_price' => 'decimal:2',
        'barber_commission' => 'decimal:2',
        'checked_in_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    protected $appends = [
        'formatted_total_price',
        'formatted_duration',
        'status_text',
        'status_color',
        'time_slot',
    ];

    public function barber()
    {
        return $this->belongsTo(Barber::class);
    }

    public function getServicesAttribute()
    {
        if (!$this->service_ids || !is_array($this->service_ids)) {
            return collect();
        }

        return BarbershopService::whereIn('id', $this->service_ids)->get();
    }

    public function scopeToday($query)
    {
        return $query->whereDate('appointment_date', today());
    }

    public function scopeUpcoming($query)
    {
        return $query->whereDate('appointment_date', '>=', today())
            ->whereNotIn('status', ['completed', 'cancelled', 'no_show']);
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByBarber($query, $barberId)
    {
        return $query->where('barber_id', $barberId);
    }

    public function scopeInProgress($query)
    {
        return $query->where('status', 'in_progress');
    }

    public function getFormattedTotalPriceAttribute(): string
    {
        $amount = $this->total_price ?? 0;
        return 'Rp ' . number_format($amount, 0, ',', '.');
    }

    public function getFormattedDurationAttribute(): string
    {
        $minutes = (int) ($this->total_duration ?? 0);
        $hours = intdiv($minutes, 60);
        $remainingMinutes = $minutes % 60;

        if ($hours > 0 && $remainingMinutes > 0) {
            return $hours . 'j ' . $remainingMinutes . 'm';
        }

        if ($hours > 0) {
            return $hours . ' jam';
        }

        return $remainingMinutes . ' menit';
    }

    public function getStatusColorAttribute(): string
    {
        return match ($this->status) {
            'scheduled' => 'blue',
            'confirmed' => 'emerald',
            'in_progress' => 'amber',
            'completed' => 'green',
            'cancelled' => 'red',
            'no_show' => 'gray',
            default => 'blue',
        };
    }

    public function getStatusTextAttribute(): string
    {
        return match ($this->status) {
            'scheduled' => 'Terjadwal',
            'confirmed' => 'Dikonfirmasi',
            'in_progress' => 'Berlangsung',
            'completed' => 'Selesai',
            'cancelled' => 'Dibatalkan',
            'no_show' => 'Tidak Hadir',
            default => 'Terjadwal',
        };
    }

    public function getTimeSlotAttribute(): ?string
    {
        if (!$this->start_time || !$this->end_time) {
            return null;
        }

        return $this->formatTime($this->start_time) . ' - ' . $this->formatTime($this->end_time);
    }

    public function calculateCommission(): float
    {
        if ($this->barber && $this->total_price) {
            $this->barber_commission = $this->total_price * ($this->barber->commission_rate / 100);
            return (float) $this->barber_commission;
        }

        $this->barber_commission = 0;
        return 0;
    }

    public function canBeRated(): bool
    {
        return $this->status === 'completed' && is_null($this->customer_rating);
    }

    public function isToday(): bool
    {
        return $this->appointment_date ? $this->appointment_date->isToday() : false;
    }

    public function isPast(): bool
    {
        return $this->appointment_date ? $this->appointment_date->isPast() : false;
    }

    public function getTimeSlot(): ?string
    {
        return $this->time_slot;
    }

    public function checkIn(): void
    {
        $this->update([
            'status' => 'confirmed',
            'checked_in_at' => now(),
        ]);
    }

    public function startService(): void
    {
        $this->update(['status' => 'in_progress']);
    }

    public function complete(?string $beforePhoto = null, ?string $afterPhoto = null): void
    {
        $updateData = [
            'status' => 'completed',
            'completed_at' => now(),
        ];

        if ($beforePhoto) {
            $updateData['before_photo'] = $beforePhoto;
        }

        if ($afterPhoto) {
            $updateData['after_photo'] = $afterPhoto;
        }

        $this->update($updateData);
        $this->calculateCommission();
        $this->save();
    }

    public function addRating(int $rating, ?string $feedback = null): void
    {
        $this->update([
            'customer_rating' => $rating,
            'customer_feedback' => $feedback,
        ]);

        if ($this->barber) {
            $this->barber->updateRating($rating);
        }
    }

    public static function getTodaysRevenue(): float
    {
        return (float) self::whereDate('appointment_date', today())
            ->where('status', 'completed')
            ->sum('total_price');
    }

    public static function getMonthlyRevenue($month = null, $year = null): float
    {
        return (float) self::whereMonth('appointment_date', $month ?? now()->month)
            ->whereYear('appointment_date', $year ?? now()->year)
            ->where('status', 'completed')
            ->sum('total_price');
    }

    public function startDateTime(): ?Carbon
    {
        if (!$this->appointment_date || !$this->start_time) {
            return null;
        }

        return Carbon::parse($this->appointment_date->format('Y-m-d') . ' ' . $this->start_time);
    }

    public function endDateTime(): ?Carbon
    {
        if (!$this->appointment_date || !$this->end_time) {
            return null;
        }

        return Carbon::parse($this->appointment_date->format('Y-m-d') . ' ' . $this->end_time);
    }

    protected function formatTime(string $value): string
    {
        $format = strlen($value) === 5 ? 'H:i' : 'H:i:s';
        return Carbon::createFromFormat($format, $value)->format('H:i');
    }
}


