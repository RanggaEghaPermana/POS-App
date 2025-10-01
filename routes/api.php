<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ProductController;
use App\Http\Controllers\Api\V1\ProductAdminController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\SaleController as ApiSaleController;
use App\Http\Controllers\Api\V1\ReturnController as ApiReturnController;
use App\Http\Controllers\Api\V1\ConfigController;
use App\Http\Controllers\Api\V1\ReportController;
use App\Http\Controllers\Api\V1\UserController;
use App\Http\Controllers\Api\V1\SupplierController as ApiSupplierController;
use App\Http\Controllers\Api\V1\SupplierProductController as ApiSupplierProductController;
use App\Http\Controllers\Api\V1\PayableController as ApiPayableController;
use App\Http\Controllers\Api\V1\StockTransferController as ApiStockTransferController;
use App\Http\Controllers\Api\V1\SettingsController as ApiSettingsController;
use App\Http\Controllers\Api\V1\PricingController as ApiPricingController;
use App\Http\Controllers\Api\V1\BackupController as ApiBackupController;
use App\Http\Controllers\Api\V1\LogController as ApiLogController;
use App\Http\Controllers\Api\V1\BranchController as ApiBranchController;
use App\Http\Controllers\Api\V1\UserAdminController as ApiUserAdminController;
use App\Http\Controllers\Api\V1\UserSetupController as ApiUserSetupController;
use App\Http\Controllers\Api\V1\StaffScheduleController as ApiStaffScheduleController;
use App\Http\Controllers\Api\V1\ShiftController as ApiShiftController;
use App\Http\Controllers\Api\V1\InvoiceController as ApiInvoiceController;
use App\Http\Controllers\Api\V1\ServiceCategoryController as ApiServiceCategoryController;
use App\Http\Controllers\Api\V1\ServiceController as ApiServiceController;
use App\Http\Controllers\Api\V1\ServiceCheckoutController as ApiServiceCheckoutController;
use App\Http\Controllers\Api\V1\BusinessTypeController;
use App\Http\Controllers\Api\V1\RoleController;
use App\Http\Controllers\Api\BarberController;
use App\Http\Controllers\Api\BarbershopServiceController;
use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\CustomerProfileController;

Route::prefix('v1')->group(function () {
    // Public routes (no tenant required)
    Route::post('auth/login', [AuthController::class, 'login']);

    // Initial setup routes (no auth required for first-time setup)
    Route::middleware(['optional-tenant'])->group(function () {
        Route::get('setup/config', [ConfigController::class, 'show']); // Tenant-aware config for setup
    });
    Route::post('setup/business-type', [ConfigController::class, 'updateBusinessType']); // Public business type setup

    // Public access routes for basic operations (fallback for non-tenant context)
    Route::get('setup/categories', [CategoryController::class, 'index']); // Public categories
    Route::post('setup/categories', [CategoryController::class, 'store']); // Public category creation
    Route::put('setup/categories/{id}', [CategoryController::class, 'update']); // Public category update
    Route::delete('setup/categories/{id}', [CategoryController::class, 'destroy']); // Public category delete
    Route::delete('setup/categories', [CategoryController::class, 'destroyAll']); // Public delete all categories
    Route::get('setup/products', [ProductController::class, 'index']); // Public products
    Route::get('setup/products/stock-history', [ProductAdminController::class, 'stockHistory']); // Public stock history
    Route::post('setup/products/{id}/adjust-stock', [ProductAdminController::class, 'adjustStock']); // Public stock adjustment
    Route::get('setup/products/low-stock', [ProductAdminController::class, 'lowStock']); // Public low stock check
    // Services and service categories with optional tenant context
    Route::middleware(['optional-tenant'])->group(function () {
        Route::get('setup/services', [\App\Http\Controllers\Api\V1\ServiceController::class, 'index']); // Tenant-aware services
        Route::post('setup/services', [\App\Http\Controllers\Api\V1\ServiceController::class, 'store']); // Tenant-aware service creation
        Route::put('setup/services/{id}', [\App\Http\Controllers\Api\V1\ServiceController::class, 'update']); // Tenant-aware service update
        Route::delete('setup/services/{id}', [\App\Http\Controllers\Api\V1\ServiceController::class, 'destroy']); // Tenant-aware service delete
        Route::delete('setup/services', [\App\Http\Controllers\Api\V1\ServiceController::class, 'destroyAll']); // Tenant-aware delete all services
        Route::get('setup/service-categories', [\App\Http\Controllers\Api\V1\ServiceCategoryController::class, 'index']); // Tenant-aware service categories
        Route::post('setup/service-categories', [\App\Http\Controllers\Api\V1\ServiceCategoryController::class, 'store']); // Tenant-aware service category creation
        Route::put('setup/service-categories/{id}', [\App\Http\Controllers\Api\V1\ServiceCategoryController::class, 'update']); // Tenant-aware service category update
        Route::delete('setup/service-categories/{id}', [\App\Http\Controllers\Api\V1\ServiceCategoryController::class, 'destroy']); // Tenant-aware service category delete
    });
    Route::delete('setup/service-categories', [\App\Http\Controllers\Api\V1\ServiceCategoryController::class, 'destroyAll']); // Public delete all service categories
    Route::get('setup/branches', [ApiBranchController::class, 'index']); // Public branches
    Route::get('setup/shifts/active', [ApiShiftController::class, 'active']); // Public active shifts (read-only)
    Route::get('setup/settings', [ApiSettingsController::class, 'show']); // Public settings for setup
    Route::get('setup/reports/sales', [ReportController::class, 'sales']); // Public sales reports
    Route::get('setup/reports/sales-daily', [ReportController::class, 'salesDaily']); // Public daily sales
    Route::get('setup/admin/products-low-stock', [ProductAdminController::class, 'lowStock']); // Public low stock
    Route::get('setup/admin/products', [ProductAdminController::class, 'index']); // Public admin products
    Route::post('setup/admin/products', [ProductAdminController::class, 'store']); // Public product creation
    // Stock management routes MUST be before {id} routes
    Route::get('setup/admin/products/stock-history', [ProductAdminController::class, 'stockHistory']); // Public stock history
    Route::get('setup/admin/products/low-stock-alerts', [ProductAdminController::class, 'lowStockAlerts']); // Public low stock alerts
    // Product CRUD routes with numeric ID constraints
    Route::get('setup/admin/products/{id}', [ProductAdminController::class, 'show'])->where('id', '[0-9]+'); // Public product details
    Route::put('setup/admin/products/{id}', [ProductAdminController::class, 'update'])->where('id', '[0-9]+'); // Public product update
    Route::delete('setup/admin/products/{id}', [ProductAdminController::class, 'destroy'])->where('id', '[0-9]+'); // Public product delete
    Route::post('setup/admin/products/{id}/adjust-stock', [ProductAdminController::class, 'adjustStock'])->where('id', '[0-9]+'); // Public stock adjustment
    Route::get('setup/categories', [CategoryController::class, 'index']); // Public categories with params
    Route::get('setup/admin/users', [UserController::class, 'index']); // Public users
    Route::post('setup/admin/users', [ApiUserSetupController::class, 'store']); // Public user creation for setup
    Route::post('setup/admin/users/{id}/assign-role', [ApiUserSetupController::class, 'assignRole']); // Public role assignment for setup
    Route::get('setup/admin/roles', [RoleController::class, 'index']); // Public roles

    // Barber setup (public for initial barbershop setup)
    Route::get('setup/barbers', [BarberController::class, 'index']); // Public barber list
    Route::post('setup/barbers', [BarberController::class, 'store']); // Public barber creation for setup

    // Non-tenant routes (for authenticated users without tenant context)
    Route::middleware(['auth:sanctum'])->group(function () {
        Route::get('user/config', [ConfigController::class, 'show']); // User-specific config
        Route::post('user/business-type', [ConfigController::class, 'updateBusinessType']); // User business type setup
        Route::get('user/tenants', [UserController::class, 'tenants']);
    });

    // Tenant management (admin only, uses master database)
    Route::prefix('admin')->middleware(['auth:sanctum', 'role:super_admin'])->group(function () {
        Route::get('tenants', [\App\Http\Controllers\Api\V1\TenantController::class, 'index']);
        Route::post('tenants', [\App\Http\Controllers\Api\V1\TenantController::class, 'store']);
        Route::get('tenants/{tenant}', [\App\Http\Controllers\Api\V1\TenantController::class, 'show']);
        Route::put('tenants/{tenant}', [\App\Http\Controllers\Api\V1\TenantController::class, 'update']);
        Route::delete('tenants/{tenant}', [\App\Http\Controllers\Api\V1\TenantController::class, 'destroy']);
        Route::post('tenants/{tenant}/extend-trial', [\App\Http\Controllers\Api\V1\TenantController::class, 'extendTrial']);
        Route::post('tenants/{tenant}/subscription', [\App\Http\Controllers\Api\V1\TenantController::class, 'setSubscription']);
    });

    // Tenant-specific routes (requires tenant context)
    Route::middleware(['tenant', 'auth:sanctum', 'tenant.access'])->group(function () {
        Route::post('auth/logout', [AuthController::class, 'logout']);

        // Tenant info
        Route::get('tenant/current', [\App\Http\Controllers\Api\V1\TenantController::class, 'current']);

        // Common read access (admin|manager|cashier)
        Route::middleware(['role:super_admin|admin|manager|cashier'])->group(function(){
            Route::get('config', [ConfigController::class, 'show']);
            Route::post('settings/business-type', [ConfigController::class, 'updateBusinessType']);
            Route::get('products', [ProductController::class, 'index']);
            Route::get('admin/products-low-stock', [ProductAdminController::class, 'lowStock']);
            // Sales reports summary is available to all roles (cashier restricted server-side)
            Route::get('reports/sales', [ReportController::class, 'sales']);

            // Business Types
            Route::get('business-types', [BusinessTypeController::class, 'index']);
            Route::get('business-types/current', [BusinessTypeController::class, 'getCurrentBusinessType']);
            Route::get('business-types/{slug}', [BusinessTypeController::class, 'show']);
            Route::get('business-types/{slug}/form-fields', [BusinessTypeController::class, 'getFormFields']);

            Route::get('sales', [ApiSaleController::class, 'index']);
            Route::get('sales/by-number', [ApiSaleController::class, 'findByNumber']);
            Route::get('sales/{id}', [ApiSaleController::class, 'show']);

            // Shifts - available to all authenticated users
            Route::get('shifts', [ApiShiftController::class, 'index']);
            Route::get('shifts/active', [ApiShiftController::class, 'active']);
            Route::get('shifts/check-schedule', [ApiShiftController::class, 'checkSchedule']);
            Route::post('shifts/start', [ApiShiftController::class, 'start']);
            Route::post('shifts/{id}/end', [ApiShiftController::class, 'end']);
            Route::get('shifts/{id}', [ApiShiftController::class, 'show']);

            // Services read access
            Route::get('service-categories', [ApiServiceCategoryController::class, 'index']);
            Route::get('services', [ApiServiceController::class, 'index']);
            Route::get('services/{service}', [ApiServiceController::class, 'show']);
            Route::post('services/bulk-pricing', [ApiServiceController::class, 'bulkPricing']);
        });

        // Cashier operations (admin|manager|cashier)
        Route::middleware(['role:super_admin|admin|manager|cashier','business-hours'])->group(function(){
            Route::post('checkout', [ApiSaleController::class, 'checkout']);
            Route::post('service-checkout', [ApiServiceCheckoutController::class, 'checkout']);
            Route::post('returns', [ApiReturnController::class, 'store']);
            Route::post('invoices', [ApiInvoiceController::class, 'store']);
        });

        // Manager + Admin operations
        Route::middleware(['role:super_admin|admin|manager'])->group(function(){
            // Branches
            Route::get('branches', [ApiBranchController::class, 'index']);
            Route::post('branches', [ApiBranchController::class, 'store']);
            Route::put('branches/{id}', [ApiBranchController::class, 'update']);
            Route::delete('branches/{id}', [ApiBranchController::class, 'destroy']);

            // Products & Categories
            Route::apiResource('categories', CategoryController::class)->only(['index','store','show','update','destroy']);

            // Stock Management Routes - MUST be before other routes that use {id}
            Route::get('admin/products/stock-history', [ProductAdminController::class, 'stockHistory']);
            Route::get('admin/products/low-stock-alerts', [ProductAdminController::class, 'lowStockAlerts']);

            // Products Resource Routes
            Route::get('admin/products', [ProductAdminController::class, 'index']);
            Route::post('admin/products', [ProductAdminController::class, 'store']);
            Route::get('admin/products/{id}', [ProductAdminController::class, 'show'])->where('id', '[0-9]+');
            Route::put('admin/products/{id}', [ProductAdminController::class, 'update'])->where('id', '[0-9]+');
            Route::delete('admin/products/{id}', [ProductAdminController::class, 'destroy'])->where('id', '[0-9]+');

            // Product specific routes with numeric ID constraint
            Route::get('admin/products/{id}/stock-history', [ProductAdminController::class, 'stockHistory'])->where('id', '[0-9]+');
            Route::post('admin/products/{id}/adjust-stock', [ProductAdminController::class, 'adjustStock'])->where('id', '[0-9]+');
            Route::get('admin/products/{id}/barcode', [ProductAdminController::class, 'barcode'])->where('id', '[0-9]+');

            // Service Categories & Services Management
            Route::apiResource('service-categories', ApiServiceCategoryController::class)->except(['index','show']);
            Route::apiResource('services', ApiServiceController::class)->except(['index','show']);

            // Suppliers & Payables
            Route::apiResource('suppliers', ApiSupplierController::class)->only(['index','store','show','update','destroy']);
            Route::get('suppliers/{supplierId}/products', [ApiSupplierProductController::class, 'index']);
            Route::post('suppliers/{supplierId}/products', [ApiSupplierProductController::class, 'upsert']);
            Route::delete('suppliers/{supplierId}/products/{id}', [ApiSupplierProductController::class, 'destroy']);
            Route::get('payables', [ApiPayableController::class, 'index']);
            Route::post('payables', [ApiPayableController::class, 'store']);
            Route::get('payables/{id}', [ApiPayableController::class, 'show']);
            Route::post('payables/{id}/payments', [ApiPayableController::class, 'addPayment']);

            // Reports (operational)
            Route::get('reports/sales-daily', [ReportController::class, 'salesDaily']);
            Route::get('reports/inventory', [ReportController::class, 'inventory']);

            // Cashiers list for filters
            Route::get('cashiers', [UserController::class, 'cashiers']);
        });

        // Admin & Manager: user management (with controller-level restrictions for manager)
        Route::middleware(['role:super_admin|admin|manager'])->group(function(){
            // User Management
            Route::get('admin/users', [ApiUserAdminController::class, 'index']);
            Route::get('admin/roles', [ApiUserAdminController::class, 'roles']);
            Route::post('admin/users', [ApiUserAdminController::class, 'store']);
            Route::post('admin/users/{id}/assign-role', [ApiUserAdminController::class, 'assignRole']);
            Route::post('admin/users/{id}/password', [ApiUserAdminController::class, 'changePassword']);

            // Staff Schedules
            Route::get('admin/staff-schedules', [ApiStaffScheduleController::class, 'index']);
            Route::post('admin/users/{id}/staff-schedules', [ApiStaffScheduleController::class, 'upsertForUser']);
        });

        // Admin-only operations
        Route::middleware(['role:super_admin|admin'])->group(function(){
            // Settings & Admin
            
            // Settings & Admin
            Route::get('settings', [ApiSettingsController::class, 'show']);
            Route::put('settings', [ApiSettingsController::class, 'update']);
            Route::post('settings/fx-sync', [ApiSettingsController::class, 'fxSync']);
            Route::get('pricing/rules', [ApiPricingController::class, 'rulesIndex']);
            Route::post('pricing/rules', [ApiPricingController::class, 'rulesStore']);
            Route::put('pricing/rules/{id}', [ApiPricingController::class, 'rulesUpdate']);
            Route::delete('pricing/rules/{id}', [ApiPricingController::class, 'rulesDestroy']);
            Route::post('pricing/bulk-update', [ApiPricingController::class, 'bulkUpdate']);
            Route::post('pricing/bulk-preview', [ApiPricingController::class, 'bulkPreview']);
            Route::get('pricing/test', [ApiPricingController::class, 'testPricing']);
            Route::get('backups', [ApiBackupController::class, 'index']);
            Route::post('backups', [ApiBackupController::class, 'create']);
            Route::post('backups/{id}/restore', [ApiBackupController::class, 'restore']);
            Route::get('logs/system', [ApiLogController::class, 'system']);

            // Advanced / Financial Reports
            Route::get('reports/cashflow', [ReportController::class, 'cashflow']);
            Route::get('reports/profit-loss', [ReportController::class, 'profitLoss']);
            Route::get('reports/tax', [ReportController::class, 'tax']);
            Route::get('invoices/{id}', [ApiInvoiceController::class, 'show']);
            
        });
    });
    
    // Barbershop API Routes (v1 prefix)
    Route::prefix('barbershop')->group(function () {
        // Public routes (no authentication required)
        Route::get('services', [BarbershopServiceController::class, 'index']);
        Route::get('services/popular', [BarbershopServiceController::class, 'popularServices']);
        Route::get('services/categories', [BarbershopServiceController::class, 'categories']);
        Route::get('services/{id}', [BarbershopServiceController::class, 'show']);

        Route::get('barbers', [BarberController::class, 'index']);
        Route::get('barbers/{id}', [BarberController::class, 'show']);

        Route::get('appointments/available-slots', [AppointmentController::class, 'availableSlots']);

        // Authenticated routes
        Route::middleware('auth:sanctum')->group(function () {
            // Customer Profile Management
            Route::apiResource('customer-profiles', CustomerProfileController::class);
            Route::get('customer-profiles/user/{userId}', [CustomerProfileController::class, 'getByUser']);
            Route::get('customer-profiles/{id}/appointments', [CustomerProfileController::class, 'appointmentHistory']);
            Route::get('customer-profiles/{id}/stats', [CustomerProfileController::class, 'stats']);

            // Appointment Management (Customers can create, view their own)
            Route::apiResource('appointments', AppointmentController::class)->only(['index', 'store', 'show']);
            Route::post('appointments/{id}/cancel', [AppointmentController::class, 'cancel']);
            Route::get('appointments/today', [AppointmentController::class, 'todaysAppointments']);

            // Manager/Admin only routes
            Route::middleware(['role:super_admin|admin|manager'])->group(function () {
                // Barber Management
                Route::apiResource('barbers', BarberController::class)->except(['index', 'show']);
                Route::get('barbers/{id}/appointments/today', [BarberController::class, 'todaysAppointments']);
                Route::get('barbers/{id}/revenue/monthly', [BarberController::class, 'monthlyRevenue']);

                // Service Management
                Route::apiResource('services', BarbershopServiceController::class)->except(['index', 'show']);

                // Appointment Management (Full CRUD)
                Route::apiResource('appointments', AppointmentController::class)->except(['index', 'store', 'show']);
                Route::post('appointments/{id}/complete', [AppointmentController::class, 'complete']);
            });
        });
    });
    // Public (signed/token-based) download endpoint for browser downloads
    Route::get('backups/{id}/download', [ApiBackupController::class, 'download']);
});

// Barbershop API Routes
Route::prefix('barbershop')->group(function () {
    // Public routes (no authentication required)
    Route::get('services', [BarbershopServiceController::class, 'index']);
    Route::get('services/popular', [BarbershopServiceController::class, 'popularServices']);
    Route::get('services/categories', [BarbershopServiceController::class, 'categories']);
    Route::get('services/{id}', [BarbershopServiceController::class, 'show']);

    Route::get('barbers', [BarberController::class, 'index']);
    Route::get('barbers/{id}', [BarberController::class, 'show']);

    Route::get('appointments/available-slots', [AppointmentController::class, 'availableSlots']);

    // Authenticated routes
    Route::middleware('auth:sanctum')->group(function () {
        // Customer Profile Management
        Route::apiResource('customer-profiles', CustomerProfileController::class);
        Route::get('customer-profiles/user/{userId}', [CustomerProfileController::class, 'getByUser']);
        Route::get('customer-profiles/{id}/appointments', [CustomerProfileController::class, 'appointmentHistory']);
        Route::get('customer-profiles/{id}/stats', [CustomerProfileController::class, 'stats']);

        // Appointment Management (Customers can create, view their own)
        Route::apiResource('appointments', AppointmentController::class)->only(['index', 'store', 'show']);
        Route::post('appointments/{id}/cancel', [AppointmentController::class, 'cancel']);
        Route::get('appointments/today', [AppointmentController::class, 'todaysAppointments']);

        // Manager/Admin only routes
        Route::middleware(['role:super_admin|admin|manager'])->group(function () {
            // Barber Management
            Route::apiResource('barbers', BarberController::class)->except(['index', 'show']);
            Route::get('barbers/{id}/appointments/today', [BarberController::class, 'todaysAppointments']);
            Route::get('barbers/{id}/revenue/monthly', [BarberController::class, 'monthlyRevenue']);

            // Service Management
            Route::apiResource('services', BarbershopServiceController::class)->except(['index', 'show']);

            // Appointment Management (Full CRUD)
            Route::apiResource('appointments', AppointmentController::class)->except(['index', 'store', 'show']);
            Route::post('appointments/{id}/complete', [AppointmentController::class, 'complete']);
        });
    });
});














