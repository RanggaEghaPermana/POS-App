<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'service_category_id',
        'base_price',
        'unit',
        'description',
        'pricing_tiers',
        'estimated_duration',
        'requirements',
        'active',
        'pricing_mode',
        'barber_id',
        'barber_rate',
        'treatment_fee',
    ];

    protected $casts = [
        'base_price' => 'decimal:2',
        'pricing_tiers' => 'array',
        'active' => 'boolean',
    ];

    public function serviceCategory()
    {
        return $this->belongsTo(ServiceCategory::class);
    }

    public function getPriceForQuantity($quantity = 1)
    {
        if ($this->pricing_tiers) {
            foreach ($this->pricing_tiers as $tier) {
                if ($quantity >= $tier['min_qty']) {
                    return $tier['price'];
                }
            }
        }

        return $this->base_price;
    }
}