<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Barber;
use App\Models\BarbershopService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class AppointmentController extends Controller
{
    protected array $statusOptions = ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'];

    public function index(Request $request)
    {
        $perPage = (int) max(1, min(100, $request->query('per_page', 20)));

        $query = Appointment::query()->with(['barber.user']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('barber_id')) {
            $query->where('barber_id', $request->barber_id);
        }

        if ($request->filled('date')) {
            $query->whereDate('appointment_date', $request->date);
        }

        if ($request->filled('from') && $request->filled('to')) {
            $query->whereBetween('appointment_date', [$request->from, $request->to]);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($inner) use ($search) {
                $inner->where('customer_name', 'like', "%{$search}%")
                    ->orWhere('customer_phone', 'like', "%{$search}%");
            });
        }

        $query->orderBy('appointment_date')->orderBy('start_time');

        $appointments = $query->paginate($perPage);

        $serviceCatalog = $this->loadServiceCatalog($appointments->getCollection());

        $appointments->getCollection()->transform(function (Appointment $appointment) use ($serviceCatalog) {
            return $this->formatAppointment($appointment, $serviceCatalog);
        });

        $summary = [
            'total' => Appointment::count(),
            'today' => Appointment::whereDate('appointment_date', today())->count(),
            'upcoming' => Appointment::upcoming()->count(),
            'completed_today' => Appointment::whereDate('appointment_date', today())
                ->where('status', 'completed')
                ->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $appointments->items(),
            'meta' => [
                'current_page' => $appointments->currentPage(),
                'last_page' => $appointments->lastPage(),
                'per_page' => $appointments->perPage(),
                'total' => $appointments->total(),
            ],
            'summary' => $summary,
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'customer_name' => 'required|string|max:255',
            'customer_phone' => 'nullable|string|max:30',
            'barber_id' => 'required|exists:barbers,id',
            'service_ids' => 'required|array|min:1',
            'service_ids.*' => 'integer|exists:barbershop_services,id',
            'appointment_date' => 'required|date_format:Y-m-d|after_or_equal:today',
            'start_time' => 'required|date_format:H:i',
            'notes' => 'nullable|string',
        ], [
            'customer_name.required' => 'Nama pelanggan wajib diisi',
            'service_ids.required' => 'Pilih minimal satu layanan',
            'appointment_date.after_or_equal' => 'Tanggal janji temu tidak boleh di masa lalu',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();

        $serviceIds = collect($data['service_ids'])->filter()->unique()->values();
        $services = BarbershopService::whereIn('id', $serviceIds)->get()->keyBy('id');

        if ($services->count() !== $serviceIds->count()) {
            $missing = $serviceIds->diff($services->keys())->values();
            return response()->json([
                'success' => false,
                'message' => 'Layanan tidak ditemukan',
                'errors' => ['service_ids' => ['ID layanan berikut tidak ditemukan: ' . $missing->implode(', ')]],
            ], 422);
        }

        $totalDuration = (int) $services->sum('duration_minutes');
        $totalPrice = (float) $services->sum('price');

        $start = Carbon::createFromFormat('Y-m-d H:i', $data['appointment_date'] . ' ' . $data['start_time'], config('app.timezone'));
        $barber = Barber::find($data['barber_id']);

        if (!$barber->worksOnDay($start)) {
            return response()->json([
                'success' => false,
                'message' => 'Barber tidak bekerja pada hari yang dipilih',
            ], 422);
        }

        if (!$barber->isAvailableAt($start, $totalDuration)) {
            return response()->json([
                'success' => false,
                'message' => 'Slot waktu sudah terisi, silakan pilih jam lain',
            ], 422);
        }

        $end = $start->copy()->addMinutes($totalDuration);

        $appointment = Appointment::create([
            'customer_name' => $data['customer_name'],
            'customer_phone' => $data['customer_phone'] ?? null,
            'barber_id' => $barber->id,
            'service_ids' => $serviceIds->all(),
            'appointment_date' => $data['appointment_date'],
            'start_time' => $start->format('H:i:s'),
            'end_time' => $end->format('H:i:s'),
            'status' => 'scheduled',
            'notes' => $data['notes'] ?? null,
            'total_duration' => $totalDuration,
            'total_price' => $totalPrice,
            'barber_commission' => $barber->commission_rate ? $totalPrice * ($barber->commission_rate / 100) : 0,
        ]);

        $appointment->refresh();

        return response()->json([
            'success' => true,
            'message' => 'Janji temu berhasil dibuat',
            'data' => $this->formatAppointment($appointment, $services),
        ], 201);
    }

    public function show(string $id)
    {
        $appointment = Appointment::with('barber.user')->find($id);

        if (!$appointment) {
            return response()->json([
                'success' => false,
                'message' => 'Janji temu tidak ditemukan',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $this->formatAppointment($appointment),
        ]);
    }

    public function update(Request $request, string $id)
    {
        $appointment = Appointment::with('barber')->find($id);

        if (!$appointment) {
            return response()->json([
                'success' => false,
                'message' => 'Janji temu tidak ditemukan',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'customer_name' => 'sometimes|string|max:255',
            'customer_phone' => 'sometimes|nullable|string|max:30',
            'service_ids' => 'sometimes|array|min:1',
            'service_ids.*' => 'integer|exists:barbershop_services,id',
            'appointment_date' => 'sometimes|date_format:Y-m-d|after_or_equal:today',
            'start_time' => 'sometimes|date_format:H:i',
            'notes' => 'sometimes|nullable|string',
            'status' => ['sometimes', 'string', Rule::in($this->statusOptions)],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();

        $serviceIds = collect($data['service_ids'] ?? $appointment->service_ids ?? [])->filter()->unique()->values();
        $services = BarbershopService::whereIn('id', $serviceIds)->get()->keyBy('id');

        if ($serviceIds->isNotEmpty() && $services->count() !== $serviceIds->count()) {
            $missing = $serviceIds->diff($services->keys())->values();
            return response()->json([
                'success' => false,
                'message' => 'Layanan tidak ditemukan',
                'errors' => ['service_ids' => ['ID layanan berikut tidak ditemukan: ' . $missing->implode(', ')]],
            ], 422);
        }

        $appointmentDate = $data['appointment_date'] ?? ($appointment->appointment_date?->format('Y-m-d'));
        $startTime = $data['start_time'] ?? substr($appointment->start_time ?? '09:00:00', 0, 5);

        $totalDuration = (int) ($services->isNotEmpty() ? $services->sum('duration_minutes') : $appointment->total_duration);
        $totalPrice = (float) ($services->isNotEmpty() ? $services->sum('price') : $appointment->total_price);

        $start = Carbon::createFromFormat('Y-m-d H:i', $appointmentDate . ' ' . $startTime, config('app.timezone'));
        $barber = $appointment->barber ?? Barber::find($appointment->barber_id);

        if ($totalDuration <= 0) {
            return response()->json([
                'success' => false,
                'message' => 'Durasi layanan tidak valid',
            ], 422);
        }

        if (!$barber->worksOnDay($start)) {
            return response()->json([
                'success' => false,
                'message' => 'Barber tidak bekerja pada hari yang dipilih',
            ], 422);
        }

        if (!$barber->isAvailableAt($start, $totalDuration, $appointment->id)) {
            return response()->json([
                'success' => false,
                'message' => 'Slot waktu sudah terisi, silakan pilih jam lain',
            ], 422);
        }

        $end = $start->copy()->addMinutes($totalDuration);

        $updateData = [
            'service_ids' => $serviceIds->isNotEmpty() ? $serviceIds->all() : $appointment->service_ids,
            'appointment_date' => $appointmentDate,
            'start_time' => $start->format('H:i:s'),
            'end_time' => $end->format('H:i:s'),
            'total_duration' => $totalDuration,
            'total_price' => $totalPrice,
            'barber_commission' => $barber->commission_rate ? $totalPrice * ($barber->commission_rate / 100) : $appointment->barber_commission,
        ];

        if (array_key_exists('customer_name', $data)) {
            $updateData['customer_name'] = $data['customer_name'];
        }

        if (array_key_exists('customer_phone', $data)) {
            $updateData['customer_phone'] = $data['customer_phone'];
        }

        if (array_key_exists('notes', $data)) {
            $updateData['notes'] = $data['notes'];
        }

        if (isset($data['status'])) {
            $updateData = array_merge($updateData, $this->statusAttributes($data['status'], $appointment));
        }

        $appointment->update($updateData);
        $appointment->refresh();

        $serviceCatalog = $services->isNotEmpty()
            ? $services
            : $this->loadServiceCatalog(collect([$appointment]));

        return response()->json([
            'success' => true,
            'message' => 'Janji temu berhasil diperbarui',
            'data' => $this->formatAppointment($appointment, $serviceCatalog),
        ]);
    }

    public function destroy(string $id)
    {
        $appointment = Appointment::find($id);

        if (!$appointment) {
            return response()->json([
                'success' => false,
                'message' => 'Janji temu tidak ditemukan',
            ], 404);
        }

        $appointment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Janji temu berhasil dihapus',
        ]);
    }

    public function cancel(string $id)
    {
        $appointment = Appointment::find($id);

        if (!$appointment) {
            return response()->json([
                'success' => false,
                'message' => 'Janji temu tidak ditemukan',
            ], 404);
        }

        if (in_array($appointment->status, ['completed', 'cancelled', 'no_show'])) {
            return response()->json([
                'success' => false,
                'message' => 'Janji temu tidak dapat dibatalkan',
            ], 422);
        }

        $appointment->update([
            'status' => 'cancelled',
        ]);

        $appointment->refresh();

        return response()->json([
            'success' => true,
            'message' => 'Janji temu berhasil dibatalkan',
            'data' => $this->formatAppointment($appointment),
        ]);
    }

    public function complete(string $id, Request $request)
    {
        $appointment = Appointment::find($id);

        if (!$appointment) {
            return response()->json([
                'success' => false,
                'message' => 'Janji temu tidak ditemukan',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'before_photo' => 'nullable|url',
            'after_photo' => 'nullable|url',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        $appointment->complete($request->before_photo, $request->after_photo);

        if ($request->filled('notes')) {
            $appointment->update(['notes' => $request->notes]);
        }

        $appointment->refresh();

        return response()->json([
            'success' => true,
            'message' => 'Janji temu ditandai selesai',
            'data' => $this->formatAppointment($appointment),
        ]);
    }

    public function todaysAppointments()
    {
        $appointments = Appointment::with('barber.user')
            ->whereDate('appointment_date', today())
            ->orderBy('start_time')
            ->get();

        $serviceCatalog = $this->loadServiceCatalog($appointments);

        $data = $appointments->map(function (Appointment $appointment) use ($serviceCatalog) {
            return $this->formatAppointment($appointment, $serviceCatalog);
        });

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    public function availableSlots(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'barber_id' => 'required|exists:barbers,id',
            'service_ids' => 'required|array|min:1',
            'service_ids.*' => 'integer|exists:barbershop_services,id',
            'date' => 'required|date_format:Y-m-d|after_or_equal:today',
            'ignore_id' => 'nullable|integer|exists:appointments,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();
        $serviceIds = collect($data['service_ids'])->filter()->unique()->values();
        $services = BarbershopService::whereIn('id', $serviceIds)->get();

        if ($services->count() !== $serviceIds->count()) {
            $missing = $serviceIds->diff($services->pluck('id'))->values();
            return response()->json([
                'success' => false,
                'message' => 'Layanan tidak ditemukan',
                'errors' => ['service_ids' => ['ID layanan berikut tidak ditemukan: ' . $missing->implode(', ')]],
            ], 422);
        }

        $duration = (int) $services->sum('duration_minutes');
        $barber = Barber::find($data['barber_id']);
        $date = Carbon::createFromFormat('Y-m-d', $data['date'], config('app.timezone'));

        $slots = $barber->getAvailableSlots($date, $duration, 15, $data['ignore_id'] ?? null);

        return response()->json([
            'success' => true,
            'data' => [
                'date' => $date->format('Y-m-d'),
                'duration_minutes' => $duration,
                'slots' => $slots,
            ],
        ]);
    }

    protected function formatAppointment(Appointment $appointment, ?Collection $serviceCatalog = null): array
    {
        $appointment->loadMissing('barber.user');

        $serviceIds = collect($appointment->service_ids ?? []);
        $catalog = $serviceCatalog
            ? ($serviceCatalog->keys()->first() === 0 ? $serviceCatalog->keyBy('id') : $serviceCatalog)
            : BarbershopService::whereIn('id', $serviceIds)->get()->keyBy('id');

        $services = $serviceIds
            ->map(function ($id) use ($catalog) {
                $service = $catalog->get($id);
                if (!$service) {
                    return null;
                }

                return [
                    'id' => $service->id,
                    'name' => $service->name,
                    'price' => (float) $service->price,
                    'duration_minutes' => (int) $service->duration_minutes,
                    'category' => $service->category,
                ];
            })
            ->filter()
            ->values();

        return [
            'id' => $appointment->id,
            'customer_name' => $appointment->customer_name,
            'customer_phone' => $appointment->customer_phone,
            'appointment_date' => $appointment->appointment_date?->format('Y-m-d'),
            'start_time' => $appointment->start_time ? substr($appointment->start_time, 0, 5) : null,
            'end_time' => $appointment->end_time ? substr($appointment->end_time, 0, 5) : null,
            'time_slot' => $appointment->time_slot,
            'status' => $appointment->status,
            'status_text' => $appointment->status_text,
            'status_color' => $appointment->status_color,
            'total_duration' => (int) $appointment->total_duration,
            'total_price' => (float) $appointment->total_price,
            'formatted_total_price' => $appointment->formatted_total_price,
            'formatted_duration' => $appointment->formatted_duration,
            'notes' => $appointment->notes,
            'barber_commission' => (float) ($appointment->barber_commission ?? 0),
            'barber' => $appointment->barber ? [
                'id' => $appointment->barber->id,
                'name' => optional($appointment->barber->user)->name,
                'skill_level' => $appointment->barber->skill_level,
                'commission_rate' => (float) $appointment->barber->commission_rate,
            ] : null,
            'services' => $services,
            'checked_in_at' => optional($appointment->checked_in_at)->toDateTimeString(),
            'completed_at' => optional($appointment->completed_at)->toDateTimeString(),
            'customer_rating' => $appointment->customer_rating,
            'customer_feedback' => $appointment->customer_feedback,
        ];
    }

    protected function loadServiceCatalog(Collection $appointments): Collection
    {
        $serviceIds = $appointments
            ->flatMap(fn(Appointment $appointment) => $appointment->service_ids ?? [])
            ->filter()
            ->unique()
            ->values();

        return $serviceIds->isEmpty()
            ? collect()
            : BarbershopService::whereIn('id', $serviceIds)->get()->keyBy('id');
    }

    protected function statusAttributes(string $status, Appointment $appointment): array
    {
        return match ($status) {
            'confirmed' => [
                'status' => 'confirmed',
                'checked_in_at' => $appointment->checked_in_at ?? now(),
            ],
            'in_progress' => [
                'status' => 'in_progress',
                'checked_in_at' => $appointment->checked_in_at ?? now(),
            ],
            'completed' => [
                'status' => 'completed',
                'checked_in_at' => $appointment->checked_in_at ?? now(),
                'completed_at' => now(),
            ],
            'cancelled' => [
                'status' => 'cancelled',
            ],
            'no_show' => [
                'status' => 'no_show',
            ],
            default => [
                'status' => 'scheduled',
            ],
        };
    }
}
