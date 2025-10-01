<?php
require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

foreach (App\Models\ActivityLog::latest()->limit(20)->get() as $l) {
    echo $l->id.'|'.$l->action.'|'.$l->ip.'|'.$l->created_at.'|'.$l->meta."\n";
}
