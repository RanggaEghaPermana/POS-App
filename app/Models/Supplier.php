<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    use HasFactory;

    protected $fillable = [
        'name','contact_name','phone','email','address','payment_terms','rating','notes'
    ];

    public function products()
    {
        return $this->hasMany(SupplierProduct::class);
    }

    public function invoices()
    {
        return $this->hasMany(VendorInvoice::class);
    }
}

