<?php

return [
    'exclude_tables' => [
        'migrations',
        'tenants',
        'users',
        'model_has_roles',
        'model_has_permissions',
        'role_has_permissions',
        'roles',
        'permissions',
        'failed_jobs',
        'jobs',
        'job_batches',
        'password_reset_tokens',
        'personal_access_tokens',
        'sessions',
        'cache',
        'cache_locks',
        'activity_logs',
    ],

    'global_seed_tables' => [
        'business_types',
        'service_categories',
        'services',
    ],
];
