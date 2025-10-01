<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_login_and_get_token(): void
    {
        $user = User::factory()->create([
            'password' => 'secret123',
        ]);

        $res = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'secret123',
            'device_name' => 'phpunit'
        ]);

        $res->assertOk()->assertJsonStructure(['token','user'=>['id','name','email']]);
    }
}

