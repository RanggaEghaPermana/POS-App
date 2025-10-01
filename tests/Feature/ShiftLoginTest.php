<?php

namespace Tests\Feature;

use App\Models\StaffSchedule;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;
use Carbon\Carbon;

class ShiftLoginTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::firstOrCreate(['name' => 'cashier']);
    }

    public function test_cashier_login_blocked_outside_shift(): void
    {
        Carbon::setTestNow(Carbon::parse('2025-01-02 10:00:00', 'UTC')); // Thursday (day_of_week=? depends framework: 4?)

        $u = User::factory()->create(['password' => 'secret']);
        $u->assignRole('cashier');
        // dayOfWeek: Carbon 0=Sun..6=Sat
        $dow = Carbon::now()->dayOfWeek;
        StaffSchedule::create([
            'user_id' => $u->id,
            'day_of_week' => $dow,
            'start_time' => '08:00:00',
            'end_time' => '09:00:00',
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email' => $u->email,
            'password' => 'secret',
            'device_name' => 'test',
        ])->assertStatus(423);
    }

    public function test_cashier_login_allowed_within_shift(): void
    {
        Carbon::setTestNow(Carbon::parse('2025-01-02 08:30:00', 'UTC'));
        $u = User::factory()->create(['password' => 'secret']);
        $u->assignRole('cashier');
        $dow = Carbon::now()->dayOfWeek;
        StaffSchedule::create([
            'user_id' => $u->id,
            'day_of_week' => $dow,
            'start_time' => '08:00:00',
            'end_time' => '09:00:00',
        ]);
        $this->postJson('/api/v1/auth/login', [
            'email' => $u->email,
            'password' => 'secret',
            'device_name' => 'test',
        ])->assertOk()->assertJsonStructure(['token','user']);
    }
}

