<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name','sku','category_id','business_type_id','price','stock','active','image_path',
        'brand', 'cost_price', 'margin_percentage', 'supplier', 'unit_type',
        'weight', 'dimensions', 'expired_date', 'minimum_stock', 'location',
        'tax_rate', 'discount_percentage', 'notes', 'dynamic_fields'
    ];

    protected $casts = [
        'active' => 'boolean',
        'price' => 'decimal:2',
        'cost_price' => 'decimal:2',
        'margin_percentage' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'discount_percentage' => 'decimal:2',
        'dynamic_fields' => 'array'
    ];

    protected $appends = ['image_url'];

    public function getImageUrlAttribute()
    {
        if (!$this->image_path) {
            return null;
        }

        return asset('storage/' . $this->image_path);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function priceHistories()
    {
        return $this->hasMany(ProductPriceHistory::class);
    }
}
