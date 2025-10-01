<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'code',
        'name',
        'email',
        'phone',
        'address',
        'birth_date',
        'gender',
        'id_number',
        'customer_type',
        'company_name',
        'tax_number',
        'loyalty_points',
        'membership_tier',
        'membership_since',
        'membership_expires_at',
        'total_spent',
        'total_transactions',
        'average_transaction',
        'last_purchase_at',
        'first_purchase_at',
        'email_notifications',
        'sms_notifications',
        'whatsapp_notifications',
        'marketing_consent',
        'active',
        'notes',
        'metadata',
    ];

    protected $casts = [
        'birth_date' => 'date',
        'membership_since' => 'date',
        'membership_expires_at' => 'date',
        'total_spent' => 'decimal:2',
        'average_transaction' => 'decimal:2',
        'last_purchase_at' => 'datetime',
        'first_purchase_at' => 'datetime',
        'email_notifications' => 'boolean',
        'sms_notifications' => 'boolean',
        'whatsapp_notifications' => 'boolean',
        'marketing_consent' => 'boolean',
        'active' => 'boolean',
        'metadata' => 'array',
    ];

    protected static function booted()
    {
        static::creating(function ($customer) {
            if (!$customer->code) {
                $customer->code = static::generateCode();
            }
            if (!$customer->membership_since) {
                $customer->membership_since = now();
            }
        });
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function sales()
    {
        return $this->hasMany(Sale::class);
    }

    public function loyaltyTransactions()
    {
        return $this->hasMany(LoyaltyTransaction::class);
    }

    public function communications()
    {
        return $this->hasMany(CustomerCommunication::class);
    }

    // Loyalty Points Methods
    public function addLoyaltyPoints(int $points, string $reason = 'Purchase', Sale $sale = null)
    {
        $this->increment('loyalty_points', $points);

        // Create loyalty transaction record
        $this->loyaltyTransactions()->create([
            'type' => 'earned',
            'points' => $points,
            'reason' => $reason,
            'sale_id' => $sale?->id,
        ]);

        $this->updateMembershipTier();
    }

    public function redeemLoyaltyPoints(int $points, string $reason = 'Redemption', Sale $sale = null)
    {
        if ($this->loyalty_points < $points) {
            throw new \Exception('Insufficient loyalty points');
        }

        $this->decrement('loyalty_points', $points);

        // Create loyalty transaction record
        $this->loyaltyTransactions()->create([
            'type' => 'redeemed',
            'points' => -$points,
            'reason' => $reason,
            'sale_id' => $sale?->id,
        ]);
    }

    public function updateMembershipTier()
    {
        $tier = 'bronze';

        if ($this->total_spent >= 50000000) { // 50 million
            $tier = 'platinum';
        } elseif ($this->total_spent >= 20000000) { // 20 million
            $tier = 'gold';
        } elseif ($this->total_spent >= 5000000) { // 5 million
            $tier = 'silver';
        }

        if ($tier !== $this->membership_tier) {
            $this->update(['membership_tier' => $tier]);
        }
    }

    public function updatePurchaseStatistics(Sale $sale)
    {
        $this->increment('total_transactions');
        $this->increment('total_spent', $sale->grand_total);

        $this->update([
            'average_transaction' => $this->total_spent / $this->total_transactions,
            'last_purchase_at' => now(),
            'first_purchase_at' => $this->first_purchase_at ?? now(),
        ]);

        $this->updateMembershipTier();
    }

    public function getMembershipBenefits()
    {
        $benefits = [
            'bronze' => [
                'discount_percentage' => 0,
                'points_multiplier' => 1,
                'birthday_bonus_points' => 100,
            ],
            'silver' => [
                'discount_percentage' => 5,
                'points_multiplier' => 1.5,
                'birthday_bonus_points' => 250,
            ],
            'gold' => [
                'discount_percentage' => 10,
                'points_multiplier' => 2,
                'birthday_bonus_points' => 500,
            ],
            'platinum' => [
                'discount_percentage' => 15,
                'points_multiplier' => 3,
                'birthday_bonus_points' => 1000,
            ],
        ];

        return $benefits[$this->membership_tier] ?? $benefits['bronze'];
    }

    public function isBirthdayToday()
    {
        return $this->birth_date && $this->birth_date->format('m-d') === now()->format('m-d');
    }

    public function canReceiveNotifications(string $type = 'email')
    {
        return match ($type) {
            'email' => $this->email_notifications && !empty($this->email),
            'sms' => $this->sms_notifications && !empty($this->phone),
            'whatsapp' => $this->whatsapp_notifications && !empty($this->phone),
            default => false,
        };
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    public function scopeByTier($query, string $tier)
    {
        return $query->where('membership_tier', $tier);
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('customer_type', $type);
    }

    public function scopeWithBirthdayToday($query)
    {
        return $query->whereRaw('DATE_FORMAT(birth_date, "%m-%d") = ?', [now()->format('m-d')]);
    }

    public function scopeWithBirthdayThisMonth($query)
    {
        return $query->whereMonth('birth_date', now()->month);
    }

    public function scopeHighValue($query, $threshold = 10000000)
    {
        return $query->where('total_spent', '>=', $threshold);
    }

    public function scopeInactive($query, $days = 90)
    {
        return $query->where('last_purchase_at', '<', now()->subDays($days))
                    ->orWhereNull('last_purchase_at');
    }

    private static function generateCode()
    {
        do {
            $code = 'CUST-' . strtoupper(Str::random(8));
        } while (static::where('code', $code)->exists());

        return $code;
    }
}