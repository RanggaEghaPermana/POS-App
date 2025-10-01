<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockAlert extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'branch_id',
        'product_id',
        'alert_type',
        'current_stock',
        'minimum_stock',
        'reorder_level',
        'reorder_quantity',
        'expiry_date',
        'days_to_expiry',
        'priority',
        'is_active',
        'triggered_at',
        'acknowledged_at',
        'acknowledged_by',
        'resolved_at',
        'resolved_by',
        'message',
        'resolution_notes',
        'metadata',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'triggered_at' => 'datetime',
        'acknowledged_at' => 'datetime',
        'resolved_at' => 'datetime',
        'expiry_date' => 'date',
        'metadata' => 'array',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function acknowledgedBy()
    {
        return $this->belongsTo(User::class, 'acknowledged_by');
    }

    public function resolvedBy()
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }

    public static function createAlert(array $data)
    {
        // Check if similar alert already exists
        $existingAlert = static::where('branch_id', $data['branch_id'])
                              ->where('product_id', $data['product_id'])
                              ->where('alert_type', $data['alert_type'])
                              ->where('is_active', true)
                              ->first();

        if ($existingAlert) {
            // Update existing alert
            $existingAlert->update([
                'current_stock' => $data['current_stock'],
                'message' => $data['message'],
                'triggered_at' => now(),
                'metadata' => array_merge($existingAlert->metadata ?? [], $data['metadata'] ?? []),
            ]);
            return $existingAlert;
        }

        // Create new alert
        return static::create(array_merge($data, [
            'tenant_id' => app('tenant')->id,
            'triggered_at' => now(),
        ]));
    }

    public function acknowledge(User $user, string $notes = null)
    {
        $this->update([
            'acknowledged_at' => now(),
            'acknowledged_by' => $user->id,
            'resolution_notes' => $notes,
        ]);
    }

    public function resolve(User $user, string $notes = null)
    {
        $this->update([
            'is_active' => false,
            'resolved_at' => now(),
            'resolved_by' => $user->id,
            'resolution_notes' => $notes,
        ]);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('alert_type', $type);
    }

    public function scopeByPriority($query, string $priority)
    {
        return $query->where('priority', $priority);
    }

    public function scopeCritical($query)
    {
        return $query->where('priority', 'critical');
    }

    public function scopeUnacknowledged($query)
    {
        return $query->whereNull('acknowledged_at');
    }

    public function scopeUnresolved($query)
    {
        return $query->where('is_active', true);
    }
}