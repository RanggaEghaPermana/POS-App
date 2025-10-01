<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductPriceHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id','old_price','new_price','changed_by'
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}

