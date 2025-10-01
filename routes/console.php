<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('tenants:provision {--tenant=} {--fresh}', function () {
    /** @var \App\Services\Tenant\TenantDatabaseManager $manager */
    $manager = app(\App\Services\Tenant\TenantDatabaseManager::class);

    $query = \App\Models\Tenant::query();
    if ($slug = $this->option('tenant')) {
        $query->where('slug', $slug)->orWhere('code', $slug)->orWhere('id', $slug);
    }

    $tenants = $query->get();
    if ($tenants->isEmpty()) {
        $this->error('No tenants matched the provided filters.');
        return 1;
    }

    foreach ($tenants as $tenant) {
        $this->info("Provisioning {$tenant->name} ({$tenant->slug})...");
        $tenant->createDatabase();
        $manager->ensureConnectionConfigured($tenant);
        $manager->ensureSchema($tenant);
    }

    $this->info('Tenant provisioning completed.');
    return 0;
})->purpose('Ensure tenant databases exist with the correct schema and data.');

// Schedule daily FX update at 09:00 local time
Schedule::command('fx:update --target=USD --base=IDR')->dailyAt('09:00');
