<?php
// Backend API only — no Blade routes.
// Optional: you can return a simple JSON on root if hit via browser.
use Illuminate\Support\Facades\Route;
Route::get('/', function () {
    return response()->json(['message' => 'API is running', 'version' => app()->version()]);
});
