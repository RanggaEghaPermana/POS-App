<?php

namespace App\Services\Hardware;

use Illuminate\Support\Facades\Log;

class CashDrawer
{
    private $config;
    private $printer;
    private $connected = false;

    public function __construct(array $config = [], PrinterInterface $printer = null)
    {
        $this->config = $config;
        $this->printer = $printer;
    }

    public function connect()
    {
        try {
            // Cash drawer is usually connected to printer
            if ($this->printer && $this->printer->isConnected()) {
                $this->connected = true;
                return true;
            }

            // For standalone serial connection
            if (isset($this->config['port'])) {
                // Serial connection implementation would go here
                $this->connected = true;
                return true;
            }

            return false;
        } catch (\Exception $e) {
            Log::error('Cash drawer connection failed: ' . $e->getMessage());
            return false;
        }
    }

    public function disconnect()
    {
        $this->connected = false;
        return true;
    }

    public function isConnected()
    {
        return $this->connected;
    }

    public function open($reason = 'manual')
    {
        if (!$this->isConnected()) {
            throw new \Exception('Cash drawer not connected');
        }

        try {
            if ($this->printer) {
                // Use printer to send cash drawer open command
                return $this->printer->openCashDrawer();
            }

            // For direct serial connection
            if (isset($this->config['port'])) {
                return $this->sendOpenCommand();
            }

            return false;
        } catch (\Exception $e) {
            Log::error('Cash drawer open failed: ' . $e->getMessage());
            throw $e;
        }
    }

    public function getStatus()
    {
        // Most cash drawers don't provide status feedback
        return [
            'connected' => $this->isConnected(),
            'status' => 'unknown', // open/closed status usually not available
            'connection_type' => $this->config['connection_type'] ?? 'printer',
        ];
    }

    private function sendOpenCommand()
    {
        // ESC/POS command to open cash drawer
        // Usually connected to printer, so this is rarely used directly
        $command = "\x1B\x70\x00\x19\xFA";

        if (isset($this->config['port'])) {
            // Serial port communication would go here
            // This is a simplified example
            return true;
        }

        return false;
    }

    public function recordTransaction(array $transactionData)
    {
        // Log cash drawer opening for audit purposes
        Log::info('Cash drawer opened', [
            'reason' => $transactionData['reason'] ?? 'unknown',
            'user_id' => $transactionData['user_id'] ?? null,
            'sale_id' => $transactionData['sale_id'] ?? null,
            'amount' => $transactionData['amount'] ?? null,
            'timestamp' => now(),
        ]);
    }
}