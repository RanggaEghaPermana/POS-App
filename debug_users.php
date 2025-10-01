<?php
require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "USERS\n";
foreach (App\Models\User::with('roles')->get() as $u) {
    $roles = $u->roles->pluck('name')->implode(',');
    echo $u->id.'|'.$u->name.'|'.$u->email.'|'.$roles."\n";
}

echo "ROLES\n";
foreach (Spatie\Permission\Models\Role::all() as $r) {
    echo $r->id.'|'.$r->name.'|'.$r->guard_name."\n";
}
