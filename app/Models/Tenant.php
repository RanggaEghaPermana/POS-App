<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Str;
use App\Services\Tenant\TenantDatabaseManager;

class Tenant extends Model
{
    protected $connection = 'mysql';
    use HasFactory;

    protected $fillable = [
        'slug',
        'name',
        'code',
        'business_type',
        'domain',
        'subdomain',
        'database_name',
        'database_username',
        'database_password',
        'database_host',
        'database_port',
        'logo',
        'settings',
        'status',
        'features',
        'owner_name',
        'owner_email',
        'phone',
        'address',
        'city',
        'state',
        'country',
        'postal_code',
        'plan',
        'max_users',
        'max_products',
        'max_transactions_per_month',
        'trial_ends_at',
        'subscription_expires_at',
        'subscription_plan',
        'encryption_key',
        'last_accessed_at',
        'last_ip'
    ];

    protected $casts = [
        'settings' => 'array',
        'features' => 'array',
        'trial_ends_at' => 'datetime',
        'subscription_expires_at' => 'datetime',
        'last_accessed_at' => 'datetime'
    ];

    protected $hidden = [
        'database_password',
        'encryption_key'
    ];

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function branches()
    {
        return $this->hasMany(Branch::class);
    }

    public function isActive()
    {
        return $this->status === 'active';
    }

    public function isOnTrial()
    {
        return $this->trial_ends_at && $this->trial_ends_at > now();
    }

    public function hasSubscription()
    {
        return $this->subscription_expires_at && $this->subscription_expires_at > now();
    }

    public function canAccess()
    {
        return $this->isActive() && ($this->isOnTrial() || $this->hasSubscription());
    }

    public function getFeature($feature)
    {
        return $this->features[$feature] ?? false;
    }


    public static function findByDomain($domain)
    {
        return static::where('domain', $domain)
            ->orWhere('subdomain', $domain)
            ->first();
    }

    /**
     * Generate unique database name for tenant
     */
    public static function generateDatabaseName($slug): string
    {
        $prefix = config('database.tenant_prefix', 'tenant_');
        return $prefix . $slug;
    }

    /**
     * Generate unique database credentials
     */
    public static function generateDatabaseCredentials($slug): array
    {
        $username = 'tenant_' . $slug;
        $password = Str::random(16);

        return [
            'username' => $username,
            'password' => $password
        ];
    }

    /**
     * Create tenant database and user with isolated access
     */
    public function createDatabase(): bool
    {
        try {
            $manager = app(TenantDatabaseManager::class);
            $manager->ensureDatabaseExists($this);
            $manager->ensureConnectionConfigured($this);

            // Create dedicated user with password when using root access
            $masterConnection = DB::connection('mysql');
            $masterConnection->statement("CREATE USER IF NOT EXISTS '{$this->database_username}'@'%' IDENTIFIED BY '{$this->database_password}'");
            $masterConnection->statement("GRANT ALL PRIVILEGES ON `{$this->database_name}`.* TO '{$this->database_username}'@'%'");
            $masterConnection->statement("FLUSH PRIVILEGES");

            \Log::info("Created database and user for tenant: {$this->slug}");
            return true;
        } catch (\Exception $e) {
            \Log::error("Failed to create database for tenant {$this->slug}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Drop tenant database and user completely
     */
    public function dropDatabase(): bool
    {
        try {
            $masterConnection = DB::connection('mysql');

            // Drop database (all data will be lost)
            $masterConnection->statement("DROP DATABASE IF EXISTS `{$this->database_name}`");

            // Drop user
            $masterConnection->statement("DROP USER IF EXISTS '{$this->database_username}'@'%'");
            $masterConnection->statement("FLUSH PRIVILEGES");

            \Log::info("Dropped database and user for tenant: {$this->slug}");
            return true;
        } catch (\Exception $e) {
            \Log::error("Failed to drop database for tenant {$this->slug}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get database connection config for this tenant
     */
    public function getDatabaseConfig(): array
    {
        return [
            'driver' => 'mysql',
            'host' => $this->database_host ?? env('DB_HOST', '127.0.0.1'),
            'port' => $this->database_port ?? env('DB_PORT', '3306'),
            'database' => $this->database_name,
            'username' => $this->database_username,
            'password' => $this->database_password,
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
            'prefix' => '',
            'strict' => true,
            'engine' => null,
            'options' => [
                \PDO::ATTR_EMULATE_PREPARES => false,
                \PDO::ATTR_STRINGIFY_FETCHES => false,
            ],
        ];
    }

    /**
     * Configure and switch to tenant's dedicated database
     */
    public function switchDatabase(): void
    {
        $manager = app(TenantDatabaseManager::class);
        $manager->ensureDatabaseExists($this);
        $manager->ensureConnectionConfigured($this);
        $manager->ensureSchema($this);

        $connectionName = $manager->connectionName($this);

        Config::set('database.default', $connectionName);
        DB::setDefaultConnection($connectionName);

        \Log::info("Switched to tenant database: {$this->code}");
    }

    /**
     * Run migrations on tenant's database
     */
    public function migrate(): bool
    {
        try {
            $this->switchDatabase();
            $connectionName = "tenant_{$this->code}";

            // Run all business migrations on tenant database
            \Artisan::call('migrate', [
                '--database' => $connectionName,
                '--path' => 'database/migrations/tenant',
                '--force' => true
            ]);

            \Log::info("Migrated tenant database: {$this->slug}");
            return true;
        } catch (\Exception $e) {
            \Log::error("Failed to migrate tenant {$this->slug}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Seed initial business data for tenant
     */
    public function seed(): bool
    {
        try {
            $this->switchDatabase();
            $connectionName = "tenant_{$this->code}";

            // Run business-specific seeder
            \Artisan::call('db:seed', [
                '--database' => $connectionName,
                '--class' => 'TenantSeeder',
                '--force' => true
            ]);

            \Log::info("Seeded tenant database: {$this->slug}");
            return true;
        } catch (\Exception $e) {
            \Log::error("Failed to seed tenant {$this->slug}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Create complete tenant with isolated database
     */
    public static function createTenant(array $data): self
    {
        DB::beginTransaction();

        try {
            $slug = Str::slug($data['name']) . '_' . Str::random(6);
            $credentials = self::generateDatabaseCredentials($slug);

            $tenant = self::create([
                'slug' => $slug,
                'name' => $data['name'],
                'business_type' => $data['business_type'] ?? 'general',
                'database_name' => self::generateDatabaseName($slug),
                'database_username' => $credentials['username'],
                'database_password' => $credentials['password'],
                'database_host' => env('DB_HOST', '127.0.0.1'),
                'database_port' => env('DB_PORT', '3306'),
                'owner_name' => $data['owner_name'],
                'owner_email' => $data['owner_email'],
                'phone' => $data['phone'] ?? null,
                'subdomain' => $slug,
                'encryption_key' => Str::random(32),
                'plan' => $data['plan'] ?? 'free',
                'max_users' => $data['max_users'] ?? 3,
                'max_products' => $data['max_products'] ?? 100,
                'max_transactions_per_month' => $data['max_transactions_per_month'] ?? 1000,
                'trial_ends_at' => now()->addDays(30), // 30 day trial
                'status' => 'active'
            ]);

            // Create isolated database and setup
            if ($tenant->createDatabase()) {
                $manager = app(TenantDatabaseManager::class);
                $manager->ensureSchema($tenant);

                DB::commit();
                \Log::info("Successfully created tenant: {$slug}");
                return $tenant;
            } else {
                throw new \Exception("Failed to create database for tenant");
            }

        } catch (\Exception $e) {
            DB::rollback();
            \Log::error("Failed to create tenant: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Update last access tracking for security
     */
    public function updateLastAccess(string $ip = null): void
    {
        $this->update([
            'last_accessed_at' => now(),
            'last_ip' => $ip ?? request()->ip()
        ]);
    }

    /**
     * Check if tenant has reached usage limits
     */
    public function hasReachedLimits(): array
    {
        $this->switchDatabase();

        $userCount = \App\Models\User::count();
        $productCount = \App\Models\Product::count();

        // Get transaction count for current month
        $transactionCount = \App\Models\Sale::whereMonth('created_at', now()->month)
                                          ->whereYear('created_at', now()->year)
                                          ->count();

        return [
            'users' => $userCount >= $this->max_users,
            'products' => $productCount >= $this->max_products,
            'transactions' => $transactionCount >= $this->max_transactions_per_month,
            'counts' => [
                'users' => $userCount,
                'products' => $productCount,
                'transactions' => $transactionCount
            ],
            'limits' => [
                'users' => $this->max_users,
                'products' => $this->max_products,
                'transactions' => $this->max_transactions_per_month
            ]
        ];
    }
}
