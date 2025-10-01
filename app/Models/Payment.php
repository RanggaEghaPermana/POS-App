<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'sale_id',
        'method',
        'amount',
        'reference',
        'paid_at',
        'transaction_id',
        'gateway',
        'gateway_response',
        'status',
        'metadata',
        'fee',
        'net_amount',
        'qr_code_url',
        'payment_url',
        'expires_at',
        'customer_name',
        'customer_email',
        'customer_phone',
        'is_installment',
        'installment_period',
        'installment_amount'
    ];

    protected $casts = [
        'metadata' => 'array',
        'paid_at' => 'datetime',
        'expires_at' => 'datetime',
        'is_installment' => 'boolean',
        'amount' => 'decimal:2',
        'fee' => 'decimal:2',
        'net_amount' => 'decimal:2',
        'installment_amount' => 'decimal:2',
    ];

    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }

    public function isPending()
    {
        return $this->status === 'pending';
    }

    public function isCompleted()
    {
        return $this->status === 'completed';
    }

    public function isFailed()
    {
        return $this->status === 'failed';
    }

    public function isExpired()
    {
        return $this->expires_at && $this->expires_at < now();
    }

    public function calculateNetAmount()
    {
        return $this->amount - $this->fee;
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeByGateway($query, $gateway)
    {
        return $query->where('gateway', $gateway);
    }
}

