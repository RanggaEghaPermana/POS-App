<?php

namespace App\Services\Hardware;

use Mike42\Escpos\PrintConnectors\NetworkPrintConnector;
use Mike42\Escpos\PrintConnectors\WindowsPrintConnector;
use Mike42\Escpos\PrintConnectors\FilePrintConnector;
use Mike42\Escpos\Printer;
use Mike42\Escpos\EscposImage;
use Illuminate\Support\Facades\Log;

class EscPosPrinter implements PrinterInterface
{
    private $printer;
    private $connector;
    private $config;

    public function connect(array $config)
    {
        $this->config = $config;

        try {
            switch ($config['connection_type']) {
                case 'network':
                    $this->connector = new NetworkPrintConnector(
                        $config['ip_address'],
                        $config['port'] ?? 9100
                    );
                    break;

                case 'windows':
                    $this->connector = new WindowsPrintConnector($config['printer_name']);
                    break;

                case 'file':
                    $this->connector = new FilePrintConnector($config['device_path']);
                    break;

                default:
                    throw new \InvalidArgumentException("Unsupported connection type: {$config['connection_type']}");
            }

            $this->printer = new Printer($this->connector);
            return true;

        } catch (\Exception $e) {
            Log::error('Printer connection failed: ' . $e->getMessage());
            return false;
        }
    }

    public function disconnect()
    {
        if ($this->printer) {
            try {
                $this->printer->close();
                $this->printer = null;
                $this->connector = null;
                return true;
            } catch (\Exception $e) {
                Log::error('Printer disconnect failed: ' . $e->getMessage());
                return false;
            }
        }
        return true;
    }

    public function isConnected()
    {
        return $this->printer !== null;
    }

    public function printReceipt(array $receiptData)
    {
        if (!$this->isConnected()) {
            throw new \Exception('Printer not connected');
        }

        try {
            // Header
            $this->printer->setJustification(Printer::JUSTIFY_CENTER);
            if (isset($receiptData['logo']) && file_exists($receiptData['logo'])) {
                $logo = EscposImage::load($receiptData['logo']);
                $this->printer->bitImage($logo);
            }

            $this->printer->selectPrintMode(Printer::MODE_DOUBLE_WIDTH);
            $this->printer->text($receiptData['store_name'] . "\n");
            $this->printer->selectPrintMode();

            if (isset($receiptData['store_address'])) {
                $this->printer->text($receiptData['store_address'] . "\n");
            }

            if (isset($receiptData['store_phone'])) {
                $this->printer->text("Tel: " . $receiptData['store_phone'] . "\n");
            }

            $this->printer->text(str_repeat("-", 48) . "\n");

            // Transaction details
            $this->printer->setJustification(Printer::JUSTIFY_LEFT);
            $this->printer->text("Receipt #: " . $receiptData['receipt_number'] . "\n");
            $this->printer->text("Date: " . $receiptData['date'] . "\n");
            $this->printer->text("Cashier: " . $receiptData['cashier_name'] . "\n");

            if (isset($receiptData['customer_name'])) {
                $this->printer->text("Customer: " . $receiptData['customer_name'] . "\n");
            }

            $this->printer->text(str_repeat("-", 48) . "\n");

            // Items
            foreach ($receiptData['items'] as $item) {
                $this->printer->text($item['name'] . "\n");

                $qtyPrice = sprintf(
                    "%d x %s",
                    $item['quantity'],
                    number_format($item['price'], 0, ',', '.')
                );
                $total = number_format($item['total'], 0, ',', '.');

                $this->printer->text(sprintf(
                    "%-32s %15s\n",
                    $qtyPrice,
                    $total
                ));
            }

            $this->printer->text(str_repeat("-", 48) . "\n");

            // Totals
            $this->printer->text(sprintf(
                "%-32s %15s\n",
                "Subtotal:",
                number_format($receiptData['subtotal'], 0, ',', '.')
            ));

            if ($receiptData['discount'] > 0) {
                $this->printer->text(sprintf(
                    "%-32s %15s\n",
                    "Discount:",
                    number_format($receiptData['discount'], 0, ',', '.')
                ));
            }

            if ($receiptData['tax'] > 0) {
                $this->printer->text(sprintf(
                    "%-32s %15s\n",
                    "Tax:",
                    number_format($receiptData['tax'], 0, ',', '.')
                ));
            }

            $this->printer->selectPrintMode(Printer::MODE_DOUBLE_WIDTH);
            $this->printer->text(sprintf(
                "%-16s %15s\n",
                "TOTAL:",
                number_format($receiptData['total'], 0, ',', '.')
            ));
            $this->printer->selectPrintMode();

            // Payment
            $this->printer->text(str_repeat("-", 48) . "\n");
            $this->printer->text(sprintf(
                "%-32s %15s\n",
                "Payment (" . $receiptData['payment_method'] . "):",
                number_format($receiptData['paid_amount'], 0, ',', '.')
            ));

            if ($receiptData['change'] > 0) {
                $this->printer->text(sprintf(
                    "%-32s %15s\n",
                    "Change:",
                    number_format($receiptData['change'], 0, ',', '.')
                ));
            }

            // Footer
            $this->printer->text(str_repeat("-", 48) . "\n");
            $this->printer->setJustification(Printer::JUSTIFY_CENTER);
            $this->printer->text("Thank you for your purchase!\n");

            if (isset($receiptData['footer_message'])) {
                $this->printer->text($receiptData['footer_message'] . "\n");
            }

            $this->printer->feed(3);
            $this->cutPaper();

            return true;

        } catch (\Exception $e) {
            Log::error('Receipt printing failed: ' . $e->getMessage());
            throw $e;
        }
    }

    public function printKitchenOrder(array $orderData)
    {
        if (!$this->isConnected()) {
            throw new \Exception('Printer not connected');
        }

        try {
            $this->printer->setJustification(Printer::JUSTIFY_CENTER);
            $this->printer->selectPrintMode(Printer::MODE_DOUBLE_WIDTH);
            $this->printer->text("KITCHEN ORDER\n");
            $this->printer->selectPrintMode();

            $this->printer->text(str_repeat("=", 48) . "\n");

            $this->printer->setJustification(Printer::JUSTIFY_LEFT);
            $this->printer->text("Order #: " . $orderData['order_number'] . "\n");
            $this->printer->text("Time: " . $orderData['time'] . "\n");
            $this->printer->text("Table/Customer: " . $orderData['customer'] . "\n");
            $this->printer->text(str_repeat("-", 48) . "\n");

            foreach ($orderData['items'] as $item) {
                $this->printer->selectPrintMode(Printer::MODE_DOUBLE_WIDTH);
                $this->printer->text($item['quantity'] . "x " . $item['name'] . "\n");
                $this->printer->selectPrintMode();

                if (isset($item['notes']) && !empty($item['notes'])) {
                    $this->printer->text("Note: " . $item['notes'] . "\n");
                }

                if (isset($item['modifiers']) && !empty($item['modifiers'])) {
                    foreach ($item['modifiers'] as $modifier) {
                        $this->printer->text("  + " . $modifier . "\n");
                    }
                }

                $this->printer->text("\n");
            }

            if (isset($orderData['special_instructions'])) {
                $this->printer->text(str_repeat("-", 48) . "\n");
                $this->printer->text("Special Instructions:\n");
                $this->printer->text($orderData['special_instructions'] . "\n");
            }

            $this->printer->feed(3);
            $this->cutPaper();

            return true;

        } catch (\Exception $e) {
            Log::error('Kitchen order printing failed: ' . $e->getMessage());
            throw $e;
        }
    }

    public function printBarcode(string $barcode, array $options = [])
    {
        if (!$this->isConnected()) {
            throw new \Exception('Printer not connected');
        }

        try {
            $this->printer->setJustification(Printer::JUSTIFY_CENTER);

            if (isset($options['title'])) {
                $this->printer->text($options['title'] . "\n\n");
            }

            // Print barcode (Code128)
            $this->printer->setBarcodeHeight(50);
            $this->printer->setBarcodeWidth(2);
            $this->printer->barcode($barcode, Printer::BARCODE_CODE128);

            $this->printer->text("\n" . $barcode . "\n");

            if (isset($options['footer'])) {
                $this->printer->text($options['footer'] . "\n");
            }

            $this->printer->feed(2);
            $this->cutPaper();

            return true;

        } catch (\Exception $e) {
            Log::error('Barcode printing failed: ' . $e->getMessage());
            throw $e;
        }
    }

    public function printText(string $text, array $formatting = [])
    {
        if (!$this->isConnected()) {
            throw new \Exception('Printer not connected');
        }

        try {
            if (isset($formatting['bold']) && $formatting['bold']) {
                $this->printer->selectPrintMode(Printer::MODE_EMPHASIZED);
            }

            if (isset($formatting['double_width']) && $formatting['double_width']) {
                $this->printer->selectPrintMode(Printer::MODE_DOUBLE_WIDTH);
            }

            if (isset($formatting['align'])) {
                switch ($formatting['align']) {
                    case 'center':
                        $this->printer->setJustification(Printer::JUSTIFY_CENTER);
                        break;
                    case 'right':
                        $this->printer->setJustification(Printer::JUSTIFY_RIGHT);
                        break;
                    default:
                        $this->printer->setJustification(Printer::JUSTIFY_LEFT);
                }
            }

            $this->printer->text($text);

            // Reset formatting
            $this->printer->selectPrintMode();
            $this->printer->setJustification(Printer::JUSTIFY_LEFT);

            return true;

        } catch (\Exception $e) {
            Log::error('Text printing failed: ' . $e->getMessage());
            throw $e;
        }
    }

    public function cutPaper()
    {
        if ($this->printer) {
            $this->printer->cut();
        }
    }

    public function openCashDrawer()
    {
        if ($this->printer) {
            $this->printer->pulse();
            return true;
        }
        return false;
    }

    public function getStatus()
    {
        // ESC/POS status checking would go here
        return [
            'connected' => $this->isConnected(),
            'paper_status' => 'ok', // Would need actual status checking
            'drawer_status' => 'closed',
        ];
    }
}