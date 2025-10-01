<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CustomerProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'phone',
        'email',
        'date_of_birth',
        'gender',
        'address',
        'preferred_barber_id',
        'hair_type',
        'skin_type',
        'allergies',
        'notes',
        'total_visits',
        'total_spent',
        'last_visit',
        'loyalty_points',
        'discount_percentage',
        'active',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'total_spent' => 'decimal:2',
        'last_visit' => 'date',
        'discount_percentage' => 'decimal:2',
        'active' => 'boolean',
    ];

    // Relationships
    public function preferredBarber()
    {
        return $this->belongsTo(Barber::class, 'preferred_barber_id');
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class, 'customer_phone', 'phone');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    public function scopeByGender($query, $gender)
    {
        return $query->where('gender', $gender);
    }

    public function scopeVip($query)
    {
        return $query->where('total_visits', '>=', 10);
    }

    public function scopeRecentCustomers($query, $days = 30)
    {
        return $query->where('last_visit', '>=', now()->subDays($days));
    }

    public function scopeHighSpenders($query, $minAmount = 500000)
    {
        return $query->where('total_spent', '>=', $minAmount);
    }

    // Accessors & Mutators
    public function getFormattedTotalSpentAttribute()
    {
        return 'Rp ' . number_format($this->total_spent, 0, ',', '.');
    }

    public function getAgeAttribute()
    {
        return $this->date_of_birth ? $this->date_of_birth->age : null;
    }

    public function getCustomerTypeAttribute()
    {
        if ($this->total_visits >= 20) {
            return 'VIP';
        } elseif ($this->total_visits >= 10) {
            return 'Premium';
        } elseif ($this->total_visits >= 5) {
            return 'Regular';
        } else {
            return 'New';
        }
    }

    public function getCustomerTypeColorAttribute()
    {
        return match($this->customer_type) {
            'VIP' => 'purple',
            'Premium' => 'yellow',
            'Regular' => 'blue',
            'New' => 'green',
            default => 'gray'
        };
    }

    // Helper Methods
    public function addVisit($amount)
    {
        $this->increment('total_visits');
        $this->increment('total_spent', $amount);
        $this->update(['last_visit' => today()]);

        $this->calculateLoyaltyPoints($amount);
    }

    public function calculateLoyaltyPoints($amount)
    {
        $points = floor($amount / 10000);
        $this->increment('loyalty_points', $points);
    }

    public function redeemLoyaltyPoints($points)
    {
        if ($this->loyalty_points >= $points) {
            $this->decrement('loyalty_points', $points);
            return true;
        }
        return false;
    }

    public function getAvailableDiscount()
    {
        if ($this->total_visits >= 50) {
            return 20; // 20% discount for 50+ visits
        } elseif ($this->total_visits >= 20) {
            return 15; // 15% discount for 20+ visits
        } elseif ($this->total_visits >= 10) {
            return 10; // 10% discount for 10+ visits
        } elseif ($this->total_visits >= 5) {
            return 5;  // 5% discount for 5+ visits
        }
        return 0;
    }

    public function hasAllergies()
    {
        return !empty($this->allergies);
    }

    public function needsSpecialCare()
    {
        return $this->hasAllergies() || !empty($this->notes);
    }

    public function getAverageSpendingPerVisit()
    {
        return $this->total_visits > 0 ? $this->total_spent / $this->total_visits : 0;
    }

    public function getDaysSinceLastVisit()
    {
        return $this->last_visit ? $this->last_visit->diffInDays(now()) : null;
    }

    public function isReturningCustomer()
    {
        return $this->total_visits > 1;
    }

    public function getRecommendedServices()
    {
        $appointments = $this->appointments()->where('status', 'completed')->get();

        if ($appointments->isEmpty()) {
            return BarbershopService::active()->limit(3)->get();
        }

        $serviceIds = $appointments->pluck('service_ids')->flatten()->unique();
        return BarbershopService::whereIn('id', $serviceIds)->active()->get();
    }

    public static function getBirthdayCustomers($month = null)
    {
        return self::whereMonth('date_of_birth', $month ?? now()->month)
                  ->active()
                  ->get();
    }

    public static function getTopCustomers($limit = 10)
    {
        return self::orderBy('total_spent', 'desc')
                  ->active()
                  ->limit($limit)
                  ->get();
    }
}
