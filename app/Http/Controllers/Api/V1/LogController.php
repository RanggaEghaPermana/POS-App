<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class LogController extends Controller
{
    public function system(Request $request)
    {
        $lines = (int)min(1000, max(10, $request->query('lines', 200)));
        $path = storage_path('logs/laravel.log');
        if (!file_exists($path)) return response()->json(['message' => 'Log file not found'], 404);
        $content = $this->tailFile($path, $lines);
        return response()->json(['lines' => $lines, 'content' => $content]);
    }

    protected function tailFile(string $filepath, int $lines = 200): string
    {
        $f = fopen($filepath, 'r');
        $buffer = '';
        $chunk = 4096;
        fseek($f, 0, SEEK_END);
        $pos = ftell($f);
        $lineCount = 0;
        while ($pos > 0 && $lineCount <= $lines) {
            $read = min($chunk, $pos);
            $pos -= $read;
            fseek($f, $pos, SEEK_SET);
            $data = fread($f, $read);
            $buffer = $data . $buffer;
            $lineCount = substr_count($buffer, "\n");
        }
        fclose($f);
        $parts = explode("\n", $buffer);
        return implode("\n", array_slice($parts, -$lines));
    }
}

