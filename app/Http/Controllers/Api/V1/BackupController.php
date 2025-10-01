<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Backup;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\PersonalAccessToken;

class BackupController extends Controller
{
    public function index()
    {
        return response()->json(Backup::latest()->paginate(50));
    }

    public function create()
    {
        $filename = 'backup-' . now()->format('Ymd-His') . '.json';
        $payload = [
            'meta' => [ 'generated_at' => now()->toIso8601String(), 'app' => config('app.name') ],
            'tables' => [
                'products' => \App\Models\Product::all(),
                'categories' => \App\Models\Category::all(),
                'app_settings' => \App\Models\AppSetting::all(),
            ],
        ];
        $json = json_encode($payload, JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE);
        $dataToStore = $json;
        $encrypted = false;
        if (filter_var(env('BACKUP_ENCRYPT', false), FILTER_VALIDATE_BOOLEAN) && ($key = env('BACKUP_KEY'))) {
            $iv = random_bytes(16);
            $cipher = openssl_encrypt($json, 'AES-256-CBC', hash('sha256', $key, true), OPENSSL_RAW_DATA, $iv);
            $dataToStore = base64_encode($iv.$cipher);
            $filename = str_replace('.json','.enc',$filename);
            $encrypted = true;
        }
        Storage::disk('local')->put('backups/'.$filename, $dataToStore);
        $size = strlen($dataToStore);
        $b = Backup::create(['filename' => $filename, 'size' => $size, 'type' => 'snapshot']);
        return response()->json($b, 201);
    }

    public function download(Request $request, int $id)
    {
        // Authenticate via Bearer token or `token` query string for browser downloads
        $token = $request->bearerToken() ?: $request->query('token');
        if (!$token) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $accessToken = PersonalAccessToken::findToken($token);
        if (!$accessToken || !$accessToken->tokenable) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $user = $accessToken->tokenable;
        if (method_exists($user, 'hasRole') && !($user->hasRole('super_admin') || $user->hasRole('admin'))) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $b = Backup::findOrFail($id);
        $path = 'backups/'.$b->filename;
        if (!Storage::disk('local')->exists($path)) return response()->json(['message'=>'File not found'], 404);
        return response()->streamDownload(function() use ($path){
            echo Storage::disk('local')->get($path);
        }, $b->filename, ['Content-Type' => 'application/octet-stream']);
    }

    public function restore(int $id)
    {
        return response()->json(['message' => 'Restore not implemented for safety. Please handle manually.'], 501);
    }
}
