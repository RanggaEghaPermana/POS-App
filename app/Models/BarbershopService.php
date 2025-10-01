<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BarbershopService extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'price',
        'duration_minutes',
        'category',
        'skill_level_required',
        'active',
        'image_url',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'active' => 'boolean',
    ];

    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    public function scopeBySkillLevel($query, $skillLevel)
    {
        return $query->where('skill_level_required', $skillLevel);
    }

    public function scopeByDuration($query, $maxDuration)
    {
        return $query->where('duration_minutes', '<=', $maxDuration);
    }

    public function getFormattedPriceAttribute(): string
    {
        return 'Rp ' . number_format($this->price ?? 0, 0, ',', '.');
    }

    public function getFormattedDurationAttribute(): string
    {
        $totalMinutes = (int) ($this->duration_minutes ?? 0);
        $hours = intdiv($totalMinutes, 60);
        $minutes = $totalMinutes % 60;

        if ($hours > 0 && $minutes > 0) {
            return $hours . 'j ' . $minutes . 'm';
        }

        if ($hours > 0) {
            return $hours . ' jam';
        }

        return $minutes . ' menit';
    }

    public function canBePerformedBy(Barber $barber): bool
    {
        $levels = ['junior' => 1, 'senior' => 2, 'master' => 3];

        $serviceLevel = $levels[$this->skill_level_required] ?? 1;
        $barberLevel = $levels[$barber->skill_level] ?? 1;

        return $barberLevel >= $serviceLevel;
    }

    public static function getPopularServices(int $limit = 5)
    {
        $services = self::where('active', true)->get();

        if ($services->isEmpty()) {
            return $services;
        }

        $usage = [];
        Appointment::whereNotIn('status', ['cancelled', 'no_show'])
            ->select(['service_ids'])
            ->get()
            ->each(function (Appointment $appointment) use (&$usage) {
                foreach ($appointment->service_ids ?? [] as $serviceId) {
                    $usage[$serviceId] = ($usage[$serviceId] ?? 0) + 1;
                }
            });

        return $services
            ->map(function (self $service) use ($usage) {
                $service->appointments_count = $usage[$service->id] ?? 0;
                return $service;
            })
            ->sortByDesc('appointments_count')
            ->take($limit)
            ->values();
    }
}
