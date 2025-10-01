<?php

namespace App\Services\Hardware;

use Illuminate\Support\Facades\Log;

class HardwareManager
{
    private $printers = [];
    private $scanners = [];
    private $cashDrawers = [];
    private $config;

    public function __construct(array $config = [])
    {
        $this->config = $config;
        $this->initializeDevices();
    }

    public function initializeDevices()
    {
        // Initialize printers
        if (isset($this->config['printers'])) {
            foreach ($this->config['printers'] as $name => $printerConfig) {
                $this->addPrinter($name, $printerConfig);
            }
        }

        // Initialize scanners
        if (isset($this->config['scanners'])) {
            foreach ($this->config['scanners'] as $name => $scannerConfig) {
                $this->addScanner($name, $scannerConfig);
            }
        }

        // Initialize cash drawers
        if (isset($this->config['cash_drawers'])) {
            foreach ($this->config['cash_drawers'] as $name => $drawerConfig) {
                $this->addCashDrawer($name, $drawerConfig);
            }
        }
    }

    public function addPrinter(string $name, array $config)
    {
        try {
            $printer = new EscPosPrinter();
            if ($printer->connect($config)) {
                $this->printers[$name] = $printer;
                Log::info("Printer '{$name}' connected successfully");
                return true;
            }
        } catch (\Exception $e) {
            Log::error("Failed to connect printer '{$name}': " . $e->getMessage());
        }
        return false;
    }

    public function addScanner(string $name, array $config)
    {
        try {
            $scanner = new BarcodeScanner($config);
            if ($scanner->connect()) {
                $this->scanners[$name] = $scanner;
                Log::info("Scanner '{$name}' connected successfully");
                return true;
            }
        } catch (\Exception $e) {
            Log::error("Failed to connect scanner '{$name}': " . $e->getMessage());
        }
        return false;
    }

    public function addCashDrawer(string $name, array $config)
    {
        try {
            $printer = isset($config['printer']) ? $this->getPrinter($config['printer']) : null;
            $cashDrawer = new CashDrawer($config, $printer);
            if ($cashDrawer->connect()) {
                $this->cashDrawers[$name] = $cashDrawer;
                Log::info("Cash drawer '{$name}' connected successfully");
                return true;
            }
        } catch (\Exception $e) {
            Log::error("Failed to connect cash drawer '{$name}': " . $e->getMessage());
        }
        return false;
    }

    public function getPrinter(string $name = 'default')
    {
        return $this->printers[$name] ?? null;
    }

    public function getScanner(string $name = 'default')
    {
        return $this->scanners[$name] ?? null;
    }

    public function getCashDrawer(string $name = 'default')
    {
        return $this->cashDrawers[$name] ?? null;
    }

    public function printReceipt(array $receiptData, string $printerName = 'receipt')
    {
        $printer = $this->getPrinter($printerName);
        if (!$printer) {
            throw new \Exception("Printer '{$printerName}' not found");
        }

        return $printer->printReceipt($receiptData);
    }

    public function printKitchenOrder(array $orderData, string $printerName = 'kitchen')
    {
        $printer = $this->getPrinter($printerName);
        if (!$printer) {
            throw new \Exception("Kitchen printer '{$printerName}' not found");
        }

        return $printer->printKitchenOrder($orderData);
    }

    public function openCashDrawer(string $reason = 'sale', array $transactionData = [])
    {
        $cashDrawer = $this->getCashDrawer();
        if (!$cashDrawer) {
            throw new \Exception('Cash drawer not found');
        }

        $result = $cashDrawer->open($reason);

        if ($result) {
            $cashDrawer->recordTransaction(array_merge($transactionData, [
                'reason' => $reason,
            ]));
        }

        return $result;
    }

    public function validateBarcode(string $barcode)
    {
        $scanner = $this->getScanner();
        if (!$scanner) {
            // Fallback validation without physical scanner
            return $this->basicBarcodeValidation($barcode);
        }

        return $scanner->validateBarcode($barcode);
    }

    public function getAllDeviceStatus()
    {
        $status = [
            'printers' => [],
            'scanners' => [],
            'cash_drawers' => [],
        ];

        foreach ($this->printers as $name => $printer) {
            $status['printers'][$name] = $printer->getStatus();
        }

        foreach ($this->scanners as $name => $scanner) {
            $status['scanners'][$name] = $scanner->getStatus();
        }

        foreach ($this->cashDrawers as $name => $drawer) {
            $status['cash_drawers'][$name] = $drawer->getStatus();
        }

        return $status;
    }

    public function testAllDevices()
    {
        $results = [];

        // Test printers
        foreach ($this->printers as $name => $printer) {
            try {
                $printer->printText("Test print from {$name}\n", ['align' => 'center']);
                $printer->cutPaper();
                $results['printers'][$name] = ['status' => 'ok', 'message' => 'Test print successful'];
            } catch (\Exception $e) {
                $results['printers'][$name] = ['status' => 'error', 'message' => $e->getMessage()];
            }
        }

        // Test cash drawers
        foreach ($this->cashDrawers as $name => $drawer) {
            try {
                $drawer->open('test');
                $results['cash_drawers'][$name] = ['status' => 'ok', 'message' => 'Drawer opened successfully'];
            } catch (\Exception $e) {
                $results['cash_drawers'][$name] = ['status' => 'error', 'message' => $e->getMessage()];
            }
        }

        // Test scanners
        foreach ($this->scanners as $name => $scanner) {
            $results['scanners'][$name] = $scanner->getStatus();
        }

        return $results;
    }

    public function disconnect()
    {
        foreach ($this->printers as $printer) {
            $printer->disconnect();
        }

        foreach ($this->scanners as $scanner) {
            $scanner->disconnect();
        }

        foreach ($this->cashDrawers as $drawer) {
            $drawer->disconnect();
        }

        $this->printers = [];
        $this->scanners = [];
        $this->cashDrawers = [];
    }

    private function basicBarcodeValidation(string $barcode)
    {
        $barcode = trim($barcode);

        if (empty($barcode)) {
            return ['valid' => false, 'error' => 'Empty barcode'];
        }

        // Basic format detection
        if (preg_match('/^\d{13}$/', $barcode)) {
            return ['valid' => true, 'format' => 'EAN13', 'barcode' => $barcode];
        }

        if (preg_match('/^\d{12}$/', $barcode)) {
            return ['valid' => true, 'format' => 'UPC-A', 'barcode' => $barcode];
        }

        if (preg_match('/^\d{8}$/', $barcode)) {
            return ['valid' => true, 'format' => 'EAN8', 'barcode' => $barcode];
        }

        return ['valid' => true, 'format' => 'Unknown', 'barcode' => $barcode];
    }
}