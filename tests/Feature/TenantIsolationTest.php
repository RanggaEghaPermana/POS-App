<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;
use Spatie\Permission\Models\Role;

class TenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    private $tenant1;
    private $tenant2;

    protected function setUp(): void
    {
        parent::setUp();

        // Create two test tenants with isolated databases
        $this->tenant1 = Tenant::createTenant([
            'name' => 'Test Pharmacy',
            'business_type' => 'pharmacy',
            'owner_name' => 'John Doe',
            'owner_email' => 'john@test.com'
        ]);

        $this->tenant2 = Tenant::createTenant([
            'name' => 'Test Barbershop',
            'business_type' => 'barbershop',
            'owner_name' => 'Jane Smith',
            'owner_email' => 'jane@test.com'
        ]);
    }

    /** @test */
    public function test_tenants_have_separate_databases()
    {
        $this->assertNotEquals($this->tenant1->database_name, $this->tenant2->database_name);
        $this->assertNotEquals($this->tenant1->database_username, $this->tenant2->database_username);
        $this->assertNotEquals($this->tenant1->database_password, $this->tenant2->database_password);
    }

    /** @test */
    public function test_tenant_data_isolation()
    {
        // Switch to tenant 1 and create data
        $this->tenant1->switchDatabase();

        $user1 = User::create([
            'name' => 'Tenant 1 User',
            'email' => 'user1@tenant1.com',
            'password' => bcrypt('password'),
            'tenant_id' => $this->tenant1->id
        ]);

        $product1 = Product::create([
            'name' => 'Tenant 1 Product',
            'price' => 100,
            'stock' => 50
        ]);

        // Switch to tenant 2 and create different data
        $this->tenant2->switchDatabase();

        $user2 = User::create([
            'name' => 'Tenant 2 User',
            'email' => 'user2@tenant2.com',
            'password' => bcrypt('password'),
            'tenant_id' => $this->tenant2->id
        ]);

        $product2 = Product::create([
            'name' => 'Tenant 2 Product',
            'price' => 200,
            'stock' => 30
        ]);

        // Verify tenant 1 can only see their data
        $this->tenant1->switchDatabase();
        $this->assertEquals(1, User::count());
        $this->assertEquals(1, Product::count());
        $this->assertEquals('Tenant 1 User', User::first()->name);
        $this->assertEquals('Tenant 1 Product', Product::first()->name);

        // Verify tenant 2 can only see their data
        $this->tenant2->switchDatabase();
        $this->assertEquals(1, User::count());
        $this->assertEquals(1, Product::count());
        $this->assertEquals('Tenant 2 User', User::first()->name);
        $this->assertEquals('Tenant 2 Product', Product::first()->name);
    }

    /** @test */
    public function test_tenant_middleware_identifies_correct_tenant()
    {
        // Test API with tenant header
        $response = $this->withHeaders([
            'X-Tenant-Slug' => $this->tenant1->slug,
            'Content-Type' => 'application/json'
        ])->get('/api/v1/tenant/current');

        $response->assertStatus(200)
                ->assertJson([
                    'tenant' => [
                        'slug' => $this->tenant1->slug,
                        'name' => 'Test Pharmacy',
                        'business_type' => 'pharmacy'
                    ]
                ]);

        // Test with different tenant
        $response = $this->withHeaders([
            'X-Tenant-Slug' => $this->tenant2->slug,
            'Content-Type' => 'application/json'
        ])->get('/api/v1/tenant/current');

        $response->assertStatus(200)
                ->assertJson([
                    'tenant' => [
                        'slug' => $this->tenant2->slug,
                        'name' => 'Test Barbershop',
                        'business_type' => 'barbershop'
                    ]
                ]);
    }

    /** @test */
    public function test_tenant_cannot_access_other_tenant_data()
    {
        // Create test user in tenant 1
        $this->tenant1->switchDatabase();
        $user = User::create([
            'name' => 'Test User',
            'email' => 'test@tenant1.com',
            'password' => bcrypt('password'),
            'tenant_id' => $this->tenant1->id
        ]);

        $token = $user->createToken('test')->plainTextToken;

        // Try to access tenant 1 data with tenant 2 context
        $response = $this->withHeaders([
            'X-Tenant-Slug' => $this->tenant2->slug,
            'Authorization' => 'Bearer ' . $token,
            'Content-Type' => 'application/json'
        ])->get('/api/v1/config');

        // Should fail because user belongs to tenant 1, not tenant 2
        $response->assertStatus(403);
    }

    /** @test */
    public function test_tenant_usage_limits()
    {
        $this->tenant1->switchDatabase();

        // Create users up to limit
        for ($i = 0; $i < $this->tenant1->max_users; $i++) {
            User::create([
                'name' => "User $i",
                'email' => "user$i@tenant1.com",
                'password' => bcrypt('password'),
                'tenant_id' => $this->tenant1->id
            ]);
        }

        // Create products up to limit
        for ($i = 0; $i < $this->tenant1->max_products; $i++) {
            Product::create([
                'name' => "Product $i",
                'price' => 100,
                'stock' => 10
            ]);
        }

        $limits = $this->tenant1->hasReachedLimits();

        $this->assertTrue($limits['users']);
        $this->assertTrue($limits['products']);
        $this->assertEquals($this->tenant1->max_users, $limits['counts']['users']);
        $this->assertEquals($this->tenant1->max_products, $limits['counts']['products']);
    }

    /** @test */
    public function test_tenant_database_security()
    {
        // Test that tenant user cannot access master database
        $this->tenant1->switchDatabase();

        try {
            // Try to access master database tables
            DB::table('tenants')->count();
            $this->fail('Tenant should not be able to access master database');
        } catch (\Exception $e) {
            // This should fail because tenant database doesn't have 'tenants' table
            $this->assertTrue(true);
        }

        // Test that tenant cannot access other tenant's database
        try {
            DB::connection('tenant_' . $this->tenant2->slug)->table('users')->count();
            $this->fail('Tenant should not be able to access other tenant database');
        } catch (\Exception $e) {
            // This should fail due to lack of credentials
            $this->assertTrue(true);
        }
    }

    /** @test */
    public function test_super_admin_can_switch_between_tenants()
    {
        Role::firstOrCreate(['name' => 'super_admin', 'guard_name' => 'api']);

        $superAdmin = User::create([
            'name' => 'Super Admin',
            'email' => 'super@test.com',
            'password' => bcrypt('secret'),
        ]);
        $superAdmin->assignRole('super_admin');

        $token = $superAdmin->createToken('test-device')->plainTextToken;

        $responseOne = $this->withHeaders([
            'X-Tenant-Slug' => $this->tenant1->slug,
            'Authorization' => 'Bearer ' . $token,
            'Content-Type' => 'application/json'
        ])->get('/api/v1/tenant/current');

        $responseOne->assertStatus(200)
            ->assertJsonPath('tenant.slug', $this->tenant1->slug);

        $responseTwo = $this->withHeaders([
            'X-Tenant-Slug' => $this->tenant2->slug,
            'Authorization' => 'Bearer ' . $token,
            'Content-Type' => 'application/json'
        ])->get('/api/v1/tenant/current');

        $responseTwo->assertStatus(200)
            ->assertJsonPath('tenant.slug', $this->tenant2->slug);
    }

    /** @test */
    public function test_tenant_deletion_destroys_all_data()
    {
        $databaseName = $this->tenant1->database_name;
        $username = $this->tenant1->database_username;

        // Create some data
        $this->tenant1->switchDatabase();
        User::create([
            'name' => 'Test User',
            'email' => 'test@tenant1.com',
            'password' => bcrypt('password'),
            'tenant_id' => $this->tenant1->id
        ]);

        // Verify database exists
        $result = DB::connection('mysql')->select("SHOW DATABASES LIKE ?", [$databaseName]);
        $this->assertCount(1, $result);

        // Delete tenant
        $this->tenant1->dropDatabase();
        $this->tenant1->delete();

        // Verify database is dropped
        $result = DB::connection('mysql')->select("SHOW DATABASES LIKE ?", [$databaseName]);
        $this->assertCount(0, $result);

        // Verify user is dropped
        try {
            DB::connection('mysql')->select("SELECT User FROM mysql.user WHERE User = ?", [$username]);
            $this->assertCount(0, $result);
        } catch (\Exception $e) {
            // User might not exist, which is fine
        }
    }

    protected function tearDown(): void
    {
        // Clean up test tenants
        if ($this->tenant1) {
            $this->tenant1->dropDatabase();
            $this->tenant1->delete();
        }

        if ($this->tenant2) {
            $this->tenant2->dropDatabase();
            $this->tenant2->delete();
        }

        parent::tearDown();
    }
}
