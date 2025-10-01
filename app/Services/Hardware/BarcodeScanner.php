<?php

namespace App\Services\Hardware;

use Illuminate\Support\Facades\Log;

class BarcodeScanner
{
    private $config;
    private $connected = false;

    public function __construct(array $config = [])
    {
        $this->config = $config;
    }

    public function connect()
    {
        try {
            // For USB HID scanners, no explicit connection is usually needed
            // They act as keyboard input devices
            $this->connected = true;
            return true;
        } catch (\Exception $e) {
            Log::error('Barcode scanner connection failed: ' . $e->getMessage());
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

    public function scan($timeout = 30)
    {
        // This would typically be handled by frontend JavaScript
        // listening for keystrokes from the scanner
        throw new \Exception('Barcode scanning should be handled on the frontend');
    }

    public function validateBarcode(string $barcode)
    {
        // Remove any whitespace
        $barcode = trim($barcode);

        // Basic validation
        if (empty($barcode)) {
            return ['valid' => false, 'error' => 'Empty barcode'];
        }

        // Check for common barcode formats
        $formats = [
            'EAN13' => '/^\d{13}$/',
            'EAN8' => '/^\d{8}$/',
            'UPC-A' => '/^\d{12}$/',
            'CODE128' => '/^[\x00-\x7F]+$/',
            'CODE39' => '/^[A-Z0-9\-\.\$\/\+\%\*\s]+$/',
        ];

        foreach ($formats as $format => $pattern) {
            if (preg_match($pattern, $barcode)) {
                return [
                    'valid' => true,
                    'format' => $format,
                    'barcode' => $barcode,
                ];
            }
        }

        return [
            'valid' => false,
            'error' => 'Unknown barcode format',
            'barcode' => $barcode,
        ];
    }

    public function generateBarcode(string $data, string $format = 'CODE128')
    {
        // This would integrate with a barcode generation library
        // For now, return the data as-is with format info
        return [
            'data' => $data,
            'format' => $format,
            'image_url' => null, // Would generate actual barcode image
        ];
    }

    public function getStatus()
    {
        return [
            'connected' => $this->isConnected(),
            'type' => $this->config['type'] ?? 'USB HID',
            'model' => $this->config['model'] ?? 'Generic',
        ];
    }
}