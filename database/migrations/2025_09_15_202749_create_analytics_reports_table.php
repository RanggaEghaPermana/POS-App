<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('analytics_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('branch_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('generated_by')->constrained('users')->onDelete('cascade');

            $table->string('report_type'); // sales, inventory, customer, financial, etc.
            $table->string('report_name');
            $table->text('description')->nullable();

            // Date range for the report
            $table->date('date_from');
            $table->date('date_to');

            // Report data
            $table->json('filters')->nullable(); // Filters applied
            $table->json('data'); // Report results
            $table->json('summary'); // Summary statistics
            $table->json('charts_data')->nullable(); // Chart configurations and data

            // Metadata
            $table->enum('status', ['generating', 'completed', 'failed'])->default('generating');
            $table->integer('execution_time_ms')->nullable(); // Generation time in milliseconds
            $table->datetime('generated_at');
            $table->datetime('expires_at')->nullable(); // Cache expiry

            // Sharing and scheduling
            $table->boolean('is_public')->default(false);
            $table->string('share_token')->nullable()->unique();
            $table->boolean('is_scheduled')->default(false);
            $table->string('schedule_frequency')->nullable(); // daily, weekly, monthly
            $table->json('schedule_config')->nullable(); // Cron config, recipients, etc.

            $table->timestamps();

            // Indexes
            $table->index(['tenant_id', 'report_type', 'date_from', 'date_to']);
            $table->index(['status', 'expires_at']);
            $table->index(['is_scheduled', 'schedule_frequency']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('analytics_reports');
    }
};