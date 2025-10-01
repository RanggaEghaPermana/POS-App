<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CustomerInvoice extends Model
{
    use HasFactory;
    protected $fillable = ['sale_id','number','date'];

    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }
}

