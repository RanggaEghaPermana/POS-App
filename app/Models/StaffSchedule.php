<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StaffSchedule extends Model
{
    use HasFactory;
    protected $fillable = [
        'user_id','day_of_week','start_time','end_time'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
