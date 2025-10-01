<?php

require_once __DIR__ . '/bootstrap/app.php';

use App\Models\ServiceCategory;
use App\Models\Service;

echo "=== SERVICE TESTING ===\n";

// Test service categories
$categories = ServiceCategory::with('services')->get();
echo "Total Categories: " . $categories->count() . "\n\n";

foreach ($categories as $cat) {
    echo "Category: {$cat->name}\n";
    echo "  Description: {$cat->description}\n";
    echo "  Icon: {$cat->icon}\n";
    echo "  Color: {$cat->color}\n";
    echo "  Services: {$cat->services->count()}\n\n";
}

// Test services
$services = Service::with('serviceCategory')->get();
echo "Total Services: " . $services->count() . "\n\n";

foreach ($services as $service) {
    echo "Service: {$service->name} ({$service->code})\n";
    echo "  Category: {$service->serviceCategory->name}\n";
    echo "  Price: {$service->base_price} per {$service->unit}\n";
    echo "  Duration: " . ($service->estimated_duration ? $service->estimated_duration . ' minutes' : 'N/A') . "\n";
    if ($service->pricing_tiers) {
        echo "  Pricing Tiers: " . json_encode($service->pricing_tiers) . "\n";
    }
    if ($service->requirements) {
        echo "  Requirements: {$service->requirements}\n";
    }
    echo "\n";
}