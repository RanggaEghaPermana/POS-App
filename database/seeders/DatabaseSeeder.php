<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Tenant;
use App\Services\Tenant\TenantDatabaseManager;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use App\Models\Role;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Clean up related tables safely
        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        $tables = [
            'model_has_permissions',
            'model_has_roles',
            'role_has_permissions',
            'roles',
            'login_histories',
            'personal_access_tokens',
            'sessions',
            'users',
        ];

        foreach ($tables as $table) {
            if (Schema::hasTable($table)) {
                DB::table($table)->truncate();
            }
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        // Seed roles (guard: api)
        $roles = ['super_admin', 'admin', 'manager', 'cashier'];
        foreach ($roles as $r) {
            Role::firstOrCreate(['name' => $r, 'guard_name' => 'api']);
        }

        // Seed super admin account (global access)
        $superAdmin = User::firstOrNew(['email' => 'ranggaegha25022003@gmail.com']);
        $superAdmin->name = 'Egha Super Admin';
        $superAdmin->password = '123';
        $superAdmin->tenant_id = null;
        $superAdmin->save();
        $superAdmin->syncRoles(['super_admin']);

        // Define demo tenants for each business type with sample accounts
        $tenantDefinitions = [
            [
                'slug' => 'photocopy-hub',
                'name' => 'Photocopy Hub',
                'business_type' => 'photocopy',
                'owner_name' => 'Owner Photocopy',
                'owner_email' => 'owner.photocopy@demo.test',
                'city' => 'Jakarta',
            ],
            [
                'slug' => 'barbershop-main',
                'name' => 'Barbershop Utama',
                'business_type' => 'barbershop',
                'owner_name' => 'Owner Barbershop',
                'owner_email' => 'owner.barbershop@demo.test',
                'city' => 'Bandung',
            ],
            [
                'slug' => 'restaurant-delight',
                'name' => 'Restaurant Delight',
                'business_type' => 'restaurant',
                'owner_name' => 'Owner Restaurant',
                'owner_email' => 'owner.restaurant@demo.test',
                'city' => 'Surabaya',
            ],
            [
                'slug' => 'retail-market',
                'name' => 'Retail Market',
                'business_type' => 'retail',
                'owner_name' => 'Owner Retail',
                'owner_email' => 'owner.retail@demo.test',
                'city' => 'Medan',
            ],
            [
                'slug' => 'laundry-fresh',
                'name' => 'Laundry Fresh',
                'business_type' => 'laundry',
                'owner_name' => 'Owner Laundry',
                'owner_email' => 'owner.laundry@demo.test',
                'city' => 'Yogyakarta',
            ],
            [
                'slug' => 'automotive-garage',
                'name' => 'Automotive Garage',
                'business_type' => 'automotive',
                'owner_name' => 'Owner Automotive',
                'owner_email' => 'owner.automotive@demo.test',
                'city' => 'Semarang',
            ],
            [
                'slug' => 'pharmacy-care',
                'name' => 'Pharmacy Care',
                'business_type' => 'pharmacy',
                'owner_name' => 'Owner Pharmacy',
                'owner_email' => 'owner.pharmacy@demo.test',
                'city' => 'Makassar',
            ],
            [
                'slug' => 'clinic-prima',
                'name' => 'Clinic Prima',
                'business_type' => 'clinic',
                'owner_name' => 'Owner Clinic',
                'owner_email' => 'owner.clinic@demo.test',
                'city' => 'Bogor',
            ],
            [
                'slug' => 'education-center',
                'name' => 'Education Center',
                'business_type' => 'education',
                'owner_name' => 'Owner Education',
                'owner_email' => 'owner.education@demo.test',
                'city' => 'Malang',
            ],
            [
                'slug' => 'consulting-pro',
                'name' => 'Consulting Pro',
                'business_type' => 'consulting',
                'owner_name' => 'Owner Consulting',
                'owner_email' => 'owner.consulting@demo.test',
                'city' => 'Denpasar',
            ],
        ];

        $manager = app(TenantDatabaseManager::class);

        foreach ($tenantDefinitions as $definition) {
            $slug = $definition['slug'];
            $tenant = Tenant::firstOrNew(['slug' => $slug]);

            $attributes = [
                'name' => $definition['name'],
                'code' => Str::upper(Str::replace('-', '_', $slug)),
                'business_type' => $definition['business_type'],
                'domain' => null,
                'subdomain' => $slug,
                'database_name' => 'tenant_' . $slug,
                'database_username' => 'tenant_' . $slug,
                'database_password' => 'tenant_' . $slug . '_pw',
                'database_host' => env('DB_HOST', '127.0.0.1'),
                'database_port' => env('DB_PORT', '3306'),
                'logo' => null,
                'settings' => null,
                'status' => 'active',
                'features' => null,
                'trial_ends_at' => now()->addDays(30),
                'subscription_expires_at' => null,
                'subscription_plan' => 'basic',
                'owner_name' => $definition['owner_name'],
                'owner_email' => $definition['owner_email'],
                'phone' => '0800' . random_int(1000000, 9999999),
                'address' => 'Jl. Contoh No. 123',
                'city' => $definition['city'],
                'state' => $definition['city'],
                'country' => 'Indonesia',
                'postal_code' => '10000',
                'plan' => 'basic',
                'max_users' => 20,
                'max_products' => 1000,
                'max_transactions_per_month' => 10000,
                'last_accessed_at' => now(),
                'last_ip' => '127.0.0.1',
            ];

            $tenant->fill($attributes);
            if (!$tenant->encryption_key) {
                $tenant->encryption_key = Str::random(32);
            }
            $tenant->save();

            $tenant->createDatabase();
            $manager->ensureConnectionConfigured($tenant);
            $manager->ensureSchema($tenant);

            $this->createTenantUser($tenant, $tenant->name . ' Admin', 'admin.' . $slug . '@demo.test', 'admin');
            $this->createTenantUser($tenant, $tenant->name . ' Manager', 'manager.' . $slug . '@demo.test', 'manager');
            $this->createTenantUser($tenant, $tenant->name . ' Cashier', 'cashier.' . $slug . '@demo.test', 'cashier');

            // Seed business-specific products
            $this->seedBusinessSpecificData($tenant);
        }

        // Seed service categories and printing services
        $this->call([
            ServiceCategoriesSeeder::class,
            BarbershopServicesSeeder::class,
        ]);
    }

    private function createTenantUser(Tenant $tenant, string $name, string $email, string $role): User
    {
        $user = User::firstOrNew(['email' => $email]);
        $user->name = $name;
        $user->password = '123';
        $user->tenant_id = $tenant->id;
        $user->save();

        $roleModel = Role::firstOrCreate(['name' => $role, 'guard_name' => 'api']);
        $user->syncRoles([$roleModel->name]);

        return $user;
    }

    private function seedBusinessSpecificData(Tenant $tenant): void
    {
        // For now, we'll seed all business types with general data
        // In the future, this can be customized per business type
        switch ($tenant->business_type) {
            case 'barbershop':
                // Barbershop will use BarbershopProductSeeder when switching to tenant database
                break;
            default:
                // Use general product seeder for other business types
                break;
        }
    }
}
