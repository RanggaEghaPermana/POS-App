<?php

namespace App\Services\Hardware;

interface PrinterInterface
{
    public function connect(array $config);

    public function disconnect();

    public function isConnected();

    public function printReceipt(array $receiptData);

    public function printKitchenOrder(array $orderData);

    public function printBarcode(string $barcode, array $options = []);

    public function printText(string $text, array $formatting = []);

    public function cutPaper();

    public function openCashDrawer();

    public function getStatus();
}