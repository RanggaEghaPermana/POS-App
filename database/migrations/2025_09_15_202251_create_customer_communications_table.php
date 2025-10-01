<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_communications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null'); // staff who initiated
            $table->enum('type', ['email', 'sms', 'whatsapp', 'phone', 'visit', 'note']);
            $table->enum('direction', ['inbound', 'outbound']);
            $table->string('subject')->nullable();
            $table->text('content');
            $table->enum('status', ['draft', 'sent', 'delivered', 'read', 'failed'])->default('draft');
            $table->datetime('sent_at')->nullable();
            $table->datetime('delivered_at')->nullable();
            $table->datetime('read_at')->nullable();
            $table->json('metadata')->nullable(); // API responses, tracking info, etc.
            $table->timestamps();

            $table->index(['customer_id', 'created_at']);
            $table->index(['type', 'status']);
            $table->index(['sent_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_communications');
    }
};