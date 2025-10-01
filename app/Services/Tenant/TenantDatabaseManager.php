<?php

namespace App\Services\Tenant;

use App\Models\Tenant;
use Illuminate\Database\DatabaseManager;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class TenantDatabaseManager
{
    public function __construct(
        private readonly DatabaseManager $db
    ) {}

    public function ensureConnectionConfigured(Tenant $tenant): void
    {
        $connectionName = $this->connectionName($tenant);
        $database = $tenant->database_name;

        if (!config()->has("database.connections.{$connectionName}")) {
            config(["database.connections.{$connectionName}" => [
                'driver' => 'mysql',
                'host' => $tenant->database_host ?? env('DB_HOST', '127.0.0.1'),
                'port' => $tenant->database_port ?? env('DB_PORT', '3306'),
                'database' => $database,
                'username' => $tenant->database_username ?? env('DB_USERNAME', 'root'),
                'password' => $tenant->database_password ?? env('DB_PASSWORD', ''),
                'charset' => 'utf8mb4',
                'collation' => 'utf8mb4_unicode_ci',
                'prefix' => '',
                'strict' => true,
                'engine' => null,
                'options' => [
                    \PDO::ATTR_EMULATE_PREPARES => false,
                    \PDO::ATTR_STRINGIFY_FETCHES => false,
                ],
            ]]);
        }
    }

    public function ensureDatabaseExists(Tenant $tenant): void
    {
        $master = $this->db->connection('mysql');
        $database = $tenant->database_name;

        $master->statement("CREATE DATABASE IF NOT EXISTS `{$database}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    }

    public function ensureSchema(Tenant $tenant): void
    {
        $connectionName = $this->connectionName($tenant);
        $database = $tenant->database_name;
        $masterDatabase = config('database.connections.mysql.database');

        // Ensure migrations table exists first
        $this->cloneTableIfMissing($tenant, 'migrations');

        $tables = $this->listMasterTables();
        $excludes = config('tenant.exclude_tables', []);

        foreach ($tables as $table) {
            if (in_array($table, $excludes, true)) {
                continue;
            }

            $this->cloneTableIfMissing($tenant, $table);

            if ($this->hasTenantColumn($table)) {
                $count = $this->db->connection($connectionName)->table($table)->count();
                if ($count === 0) {
                    $this->copyTenantScopedRows($tenant, $table);
                }
            } else {
                $count = $this->db->connection($connectionName)->table($table)->count();
                if ($count === 0 && in_array($table, config('tenant.global_seed_tables', []), true)) {
                    $this->copyGlobalRows($tenant, $table);
                }
            }
        }

        // Mark master migrations as applied in tenant database to prevent artisan from re-running.
        $this->syncMigrationLedger($tenant);

        // Purge cached connection to ensure we point to new schema
        $this->db->purge($connectionName);
        $this->db->connection($connectionName)->getPdo();
    }

    public function connectionName(Tenant $tenant): string
    {
        return 'tenant_' . $tenant->code;
    }

    private function listMasterTables(): array
    {
        $masterDatabase = config('database.connections.mysql.database');
        $rows = $this->db->connection('mysql')->select('SHOW TABLES');

        return collect($rows)
            ->map(fn ($row) => array_values((array) $row)[0])
            ->filter()
            ->values()
            ->all();
    }

    private function cloneTableIfMissing(Tenant $tenant, string $table): void
    {
        $connectionName = $this->connectionName($tenant);
        $tenantDatabase = $tenant->database_name;
        $masterDatabase = config('database.connections.mysql.database');

        $exists = $this->tableExists($tenantDatabase, $table);
        if (!$exists) {
            $sql = sprintf(
                'CREATE TABLE IF NOT EXISTS `%s`.`%s` LIKE `%s`.`%s`',
                $tenantDatabase,
                $table,
                $masterDatabase,
                $table
            );
            $this->db->connection('mysql')->statement($sql);
        }
    }

    private function tableExists(string $database, string $table): bool
    {
        $result = $this->db->connection('mysql')->select(
            'SELECT COUNT(*) as cnt FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?',
            [$database, $table]
        );

        return !empty($result) && (int) $result[0]->cnt > 0;
    }

    private function hasTenantColumn(string $table): bool
    {
        $masterDatabase = config('database.connections.mysql.database');
        $result = $this->db->connection('mysql')->select(
            'SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1',
            [$masterDatabase, $table, 'tenant_id']
        );

        return !empty($result) && (int) $result[0]->cnt > 0;
    }

    private function copyTenantScopedRows(Tenant $tenant, string $table): void
    {
        $masterDatabase = config('database.connections.mysql.database');
        $tenantDatabase = $tenant->database_name;

        $sql = sprintf(
            'INSERT IGNORE INTO `%s`.`%s` SELECT * FROM `%s`.`%s` WHERE `tenant_id` = ?',
            $tenantDatabase,
            $table,
            $masterDatabase,
            $table
        );

        $this->db->connection('mysql')->statement($sql, [$tenant->id]);
    }

    private function copyGlobalRows(Tenant $tenant, string $table): void
    {
        $masterDatabase = config('database.connections.mysql.database');
        $tenantDatabase = $tenant->database_name;

        $sql = sprintf(
            'INSERT IGNORE INTO `%s`.`%s` SELECT * FROM `%s`.`%s`',
            $tenantDatabase,
            $table,
            $masterDatabase,
            $table
        );

        $this->db->connection('mysql')->statement($sql);
    }

    private function syncMigrationLedger(Tenant $tenant): void
    {
        $tenantConnection = $this->connectionName($tenant);
        $tenantDatabase = $tenant->database_name;

        if (!$this->tableExists($tenantDatabase, 'migrations')) {
            return;
        }

        $masterMigrations = $this->db->connection('mysql')->table('migrations')->get();
        $tenantMigrations = $this->db->connection($tenantConnection)->table('migrations')->pluck('migration');

        $toInsert = $masterMigrations
            ->reject(fn ($row) => $tenantMigrations->contains($row->migration))
            ->map(function ($row) {
                return [
                    'migration' => $row->migration,
                    'batch' => 0,
                ];
            });

        if ($toInsert->isNotEmpty()) {
            $this->db->connection($tenantConnection)->table('migrations')->insert($toInsert->all());
        }
    }
}
