<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Sale extends Model
{
    use HasFactory;

    protected $fillable = [
        'number','subtotal','discount','tax','rounding_adjustment','rounding_policy','rounding_mode','fx_target','fx_rate_used','fx_timestamp','grand_total','payment_status','paid_amount','change_amount','cashier_id',
        'type','estimated_duration','notes','branch_id','user_id','customer_id','total'
    ];

    public function items()
    {
        return $this->hasMany(SaleItem::class);
    }

    public function saleItems()
    {
        return $this->hasMany(SaleItem::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function cashier()
    {
        return $this->belongsTo(\App\Models\User::class, 'cashier_id');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
}
