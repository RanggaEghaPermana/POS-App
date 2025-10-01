import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../AuthContext'
import { useNavigate } from 'react-router-dom'
import { apiGet, apiPatch, apiPost } from '../api'
import { formatRupiah } from '../utils/formatters'
import { loadServicesFromStorage, loadCategoriesFromStorage, loadBarbersFromStorage, loadAppointmentsFromStorage, saveAppointmentsToStorage, initializeBarbershopData } from '../utils/barbershopData'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Badge } from '../components/ui/badge'
import { Checkbox } from '../components/ui/checkbox'
import { Textarea } from '../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { LoadingSpinner } from '../components/ui/loading'
import {
  Calendar,
  Clock,
  User as UserIcon,
  Phone,
  Scissors,
  Plus,
  Search,
  RefreshCw,
  CheckCircle,
  Play,
  Ban,
  Users,
  Filter,
  Timer,
  DollarSign
} from 'lucide-react'

const STATUS_OPTIONS = [
  { value: 'semua', label: 'Semua Status' },
  { value: 'scheduled', label: 'Terjadwal' },
  { value: 'confirmed', label: 'Dikonfirmasi' },
  { value: 'in_progress', label: 'Sedang Berlangsung' },
  { value: 'paid', label: 'Sudah Dibayar' },
  { value: 'completed', label: 'Selesai' },
  { value: 'cancelled', label: 'Dibatalkan' },
  { value: 'no_show', label: 'Tidak Hadir' }
]


const today = new Date().toISOString().slice(0, 10)

// Using shared barber data from barbershopData.js

// Using shared appointment data and utilities

// Countdown Timer Component for in-progress appointments
function CountdownTimer({ appointment }) {
  const [timeDisplay, setTimeDisplay] = useState('');
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    const calculateTime = () => {
      if (!appointment.started_at) {
        setTimeDisplay(`${appointment.total_duration}:00`);
        setIsOverdue(false);
        return;
      }

      const now = new Date();
      const startedAt = new Date(appointment.started_at);

      // Calculate elapsed time in milliseconds
      const elapsedMs = now.getTime() - startedAt.getTime();

      // Total duration in milliseconds
      const totalDurationMs = appointment.total_duration * 60 * 1000;

      // Remaining time
      const remainingMs = totalDurationMs - elapsedMs;

      if (remainingMs <= 0) {
        // Overtime
        setIsOverdue(true);
        const overtimeMs = Math.abs(remainingMs);
        const overtimeMins = Math.floor(overtimeMs / (1000 * 60));
        const overtimeSecs = Math.floor((overtimeMs % (1000 * 60)) / 1000);
        setTimeDisplay(`+${overtimeMins}:${overtimeSecs.toString().padStart(2, '0')}`);
      } else {
        // Normal countdown
        setIsOverdue(false);
        const remainingMins = Math.floor(remainingMs / (1000 * 60));
        const remainingSecs = Math.floor((remainingMs % (1000 * 60)) / 1000);
        setTimeDisplay(`${remainingMins}:${remainingSecs.toString().padStart(2, '0')}`);
      }
    };

    // Initial calculation
    calculateTime();

    // Update every second
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [appointment.started_at, appointment.total_duration]);

  return (
    <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md transition-colors ${
      isOverdue
        ? 'bg-red-100 text-red-700 hover:bg-red-150'
        : 'bg-amber-100 text-amber-700 hover:bg-amber-150'
    }`}>
      <Timer className="h-3 w-3" />
      <span>
        {isOverdue ? 'Overtime ' : ''}
        {timeDisplay}
      </span>
    </div>
  );
}

const defaultForm = {
  customer_name: '',
  customer_phone: '',
  barber_id: '',
  appointment_date: today,
  service_ids: [],
  start_time: '',
  notes: ''
}

export default function Appointments() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const isMockMode = import.meta.env.VITE_MOCK_BARBERSHOP === "true" || true;
  const [loading, setLoading] = useState(false)
  const [appointments, setAppointments] = useState([])
  const [summary, setSummary] = useState({})
  const [meta, setMeta] = useState({})
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ date: today, status: 'semua', barber_id: 'all', search: '' })
  const [barbers, setBarbers] = useState([])
  const [services, setServices] = useState([])
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [availableSlots, setAvailableSlots] = useState([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [formSubmitting, setFormSubmitting] = useState(false)

  const serviceMap = useMemo(() => {
    const map = new Map()
    services.forEach((service) => {
      map.set(service.id, service)
    })
    return map
  }, [services])

  const servicesByCategory = useMemo(() => {
    return services.reduce((acc, service) => {
      const category = service.category || 'Layanan'
      if (!acc[category]) acc[category] = []
      acc[category].push(service)
      return acc
    }, {})
  }, [services])

  const totals = useMemo(() => {
    const selected = form.service_ids.map((id) => serviceMap.get(id)).filter(Boolean)
    const duration = selected.reduce((sum, service) => sum + (service.duration_minutes || 0), 0)
    const price = selected.reduce((sum, service) => sum + parseFloat(service.price || 0), 0)
    return { duration, price }
  }, [form.service_ids, serviceMap])

  useEffect(() => {
    initializeBarbershopData()
    loadMasters()
  }, [])

  useEffect(() => {
    loadAppointments(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.date, filters.status, filters.barber_id])

  useEffect(() => {
    if (!formOpen) return

    if (form.barber_id && form.service_ids.length > 0 && form.appointment_date) {
      fetchSlotOptions()
    } else {
      setAvailableSlots([])
      if (form.start_time) {
        setForm((prev) => ({ ...prev, start_time: '' }))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formOpen, form.barber_id, form.service_ids, form.appointment_date])

  function handleFilterChange(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  async function loadMasters() {
    if (isMockMode) {
      setTimeout(() => {
        // Load from shared storage like other pages
        const storedServices = loadServicesFromStorage();
        // Transform services to match appointment format
        const servicesForAppointment = storedServices.map(service => ({
          id: service.id,
          name: service.name,
          category: service.service_category_id,
          price: service.base_price,
          duration_minutes: service.estimated_duration || 30
        }));

        setBarbers(loadBarbersFromStorage());
        setServices(servicesForAppointment);
      }, 300);
      return;
    }

    try {
      const [barberRes, serviceRes] = await Promise.all([
        apiGet('/setup/barbers?active=true', token).catch(() => ({ data: [] })),
        apiGet('/setup/services?active=true', token).catch(() => ({ data: [] }))
      ])

      setBarbers(barberRes.data || [])
      setServices(serviceRes.data || [])
    } catch (error) {
      console.error('Gagal memuat master data', error)
      // Fallback to mock data
      const storedServices = loadServicesFromStorage();
      const servicesForAppointment = storedServices.map(service => ({
        id: service.id,
        name: service.name,
        category: service.service_category_id,
        price: service.base_price,
        duration_minutes: service.estimated_duration || 30
      }));

      setBarbers(loadBarbersFromStorage());
      setServices(servicesForAppointment);
    }
  }

  async function loadAppointments(targetPage = 1, customFilters) {
    setLoading(true)

    if (isMockMode) {
      setTimeout(() => {
        let storedAppointments = loadAppointmentsFromStorage();
        const currentFilters = customFilters ?? filters;

        // Apply filters
        if (currentFilters.status && currentFilters.status !== 'semua') {
          storedAppointments = storedAppointments.filter(apt => apt.status === currentFilters.status);
        }

        if (currentFilters.barber_id && currentFilters.barber_id !== 'all') {
          storedAppointments = storedAppointments.filter(apt => apt.barber_id === currentFilters.barber_id);
        }

        if (currentFilters.search) {
          storedAppointments = storedAppointments.filter(apt =>
            apt.customer_name.toLowerCase().includes(currentFilters.search.toLowerCase()) ||
            (apt.customer_phone && apt.customer_phone.includes(currentFilters.search))
          );
        }

        // Filter by date if specified
        if (currentFilters.date) {
          storedAppointments = storedAppointments.filter(apt => apt.appointment_date === currentFilters.date);
        }

        // Sort by newest first (by created_at timestamp)
        storedAppointments = storedAppointments.sort((a, b) => {
          const dateA = new Date(a.created_at || a.appointment_date);
          const dateB = new Date(b.created_at || b.appointment_date);
          return dateB.getTime() - dateA.getTime();
        });

        // Mock summary
        const allAppointments = loadAppointmentsFromStorage();
        const summary = {
          total: allAppointments.length,
          scheduled: allAppointments.filter(a => a.status === 'scheduled').length,
          confirmed: allAppointments.filter(a => a.status === 'confirmed').length,
          in_progress: allAppointments.filter(a => a.status === 'in_progress').length,
          paid: allAppointments.filter(a => a.status === 'paid').length,
          completed: allAppointments.filter(a => a.status === 'completed').length,
          cancelled: allAppointments.filter(a => a.status === 'cancelled').length,
          revenue_today: allAppointments
            .filter(a => a.status === 'completed' && a.appointment_date === today)
            .reduce((sum, a) => sum + a.total_price, 0)
        };

        setAppointments(storedAppointments);
        setSummary(summary);
        setMeta({ total: storedAppointments.length, per_page: 10, current_page: targetPage });
        setPage(targetPage);
        setLoading(false);
      }, 300);
      return;
    }

    try {
      const params = new URLSearchParams()
      params.set('per_page', 10)
      params.set('page', targetPage)
      const currentFilters = customFilters ?? filters

      if (currentFilters.date) params.set('date', currentFilters.date)
      if (currentFilters.status && currentFilters.status !== 'semua') params.set('status', currentFilters.status)
      if (currentFilters.barber_id && currentFilters.barber_id !== 'all') params.set('barber_id', currentFilters.barber_id)
      if (currentFilters.search) params.set('search', currentFilters.search)

      const result = await apiGet(`/barbershop/appointments?${params.toString()}`, token)
      setAppointments(result.data || [])
      setSummary(result.summary || {})
      setMeta(result.meta || {})
      setPage(targetPage)
    } catch (error) {
      console.error('Gagal memuat janji temu', error)
      // Fallback to mock data
      const mockAppointments = getMockAppointments();
      const summary = {
        total: mockAppointments.length,
        scheduled: mockAppointments.filter(a => a.status === 'scheduled').length,
        confirmed: mockAppointments.filter(a => a.status === 'confirmed').length,
        in_progress: mockAppointments.filter(a => a.status === 'in_progress').length,
        paid: mockAppointments.filter(a => a.status === 'paid').length,
        completed: mockAppointments.filter(a => a.status === 'completed').length,
        cancelled: mockAppointments.filter(a => a.status === 'cancelled').length,
        revenue_today: mockAppointments
          .filter(a => a.status === 'completed')
          .reduce((sum, a) => sum + a.total_price, 0)
      };
      setAppointments(mockAppointments);
      setSummary(summary);
      setMeta({ total: mockAppointments.length, per_page: 10, current_page: targetPage });
    } finally {
      setLoading(false)
    }
  }

  async function fetchSlotOptions() {
    setSlotsLoading(true)

    if (isMockMode) {
      setTimeout(() => {
        // Get selected barber's schedule
        const selectedBarber = barbers.find(b => b.id === form.barber_id);
        if (!selectedBarber) {
          setAvailableSlots([]);
          setSlotsLoading(false);
          return;
        }

        // Get day of week for the selected date
        const selectedDate = new Date(form.appointment_date);
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = dayNames[selectedDate.getDay()];
        const barberSchedule = selectedBarber.schedule[dayName];

        // Check if barber works on this day
        if (barberSchedule === 'off' || !barberSchedule) {
          setAvailableSlots([]);
          setSlotsLoading(false);
          return;
        }

        // Calculate total duration needed for selected services
        const selectedServices = form.service_ids.map(id => serviceMap.get(id)).filter(Boolean);
        const totalDuration = selectedServices.reduce((sum, service) => sum + (service.duration_minutes || 30), 0);

        if (totalDuration === 0) {
          setAvailableSlots([]);
          setSlotsLoading(false);
          return;
        }

        // Generate possible time slots
        const generateTimeSlots = (startHour, startMinute, endHour, endMinute, duration) => {
          const slots = [];
          let currentHour = startHour;
          let currentMinute = startMinute;

          while (currentHour < endHour || (currentHour === endHour && currentMinute <= endMinute - duration)) {
            const startTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

            // Calculate end time
            const endTimeDate = new Date();
            endTimeDate.setHours(currentHour, currentMinute + duration);
            const endTime = endTimeDate.toTimeString().slice(0, 5);

            slots.push({ start: startTime, end: endTime });

            // Move to next 15-minute slot
            currentMinute += 15;
            if (currentMinute >= 60) {
              currentHour += 1;
              currentMinute = 0;
            }
          }
          return slots;
        };

        // Parse barber schedule
        const [startHour, startMinute] = barberSchedule.start.split(':').map(Number);
        const [endHour, endMinute] = barberSchedule.end.split(':').map(Number);

        // Generate all possible slots
        const allSlots = generateTimeSlots(startHour, startMinute, endHour, endMinute, totalDuration);

        // Get existing appointments for this barber on this date
        const existingAppointments = loadAppointmentsFromStorage().filter(apt =>
          apt.barber_id === form.barber_id &&
          apt.appointment_date === form.appointment_date &&
          apt.status !== 'cancelled'
        );

        // Check which slots are available (no conflicts)
        const availableSlots = allSlots.filter(slot => {
          const slotStart = new Date(`2000-01-01T${slot.start}:00`);
          const slotEnd = new Date(`2000-01-01T${slot.end}:00`);

          // Check against all existing appointments
          return !existingAppointments.some(apt => {
            const aptStart = new Date(`2000-01-01T${apt.start_time}:00`);
            const aptEnd = new Date(`2000-01-01T${apt.end_time}:00`);

            // Check for time overlap
            return (slotStart < aptEnd && slotEnd > aptStart);
          });
        });

        setAvailableSlots(availableSlots);

        // Reset selected time if it's no longer available
        const hasSelected = availableSlots.some((slot) => slot.start === form.start_time);
        if (!hasSelected) {
          setForm((prev) => ({ ...prev, start_time: '' }));
        }
        setSlotsLoading(false);
      }, 300);
      return;
    }

    try {
      const params = new URLSearchParams()
      params.set('barber_id', form.barber_id)
      params.set('date', form.appointment_date)
      form.service_ids.forEach((id) => params.append('service_ids[]', id))
      const res = await apiGet(`/barbershop/appointments/available-slots?${params.toString()}`, token)
      const slots = res.data?.slots || []
      setAvailableSlots(slots)
      const hasSelected = slots.some((slot) => slot.start === form.start_time)
      if (!hasSelected) {
        setForm((prev) => ({ ...prev, start_time: '' }))
      }
    } catch (error) {
      console.error('Gagal memuat slot tersedia', error)
      // Fallback to mock slots
      const mockSlots = [
        { start: "09:00", end: "09:45", available: true },
        { start: "11:00", end: "11:45", available: true },
        { start: "13:00", end: "13:45", available: true },
        { start: "15:00", end: "15:45", available: true },
        { start: "16:00", end: "16:45", available: true }
      ];
      setAvailableSlots(mockSlots);
    } finally {
      setSlotsLoading(false)
    }
  }

  function openFormModal() {
    setForm({ ...defaultForm, appointment_date: filters.date || today })
    setAvailableSlots([])
    setFormOpen(true)
  }

  function toggleService(serviceId) {
    setForm((prev) => {
      const exists = prev.service_ids.includes(serviceId)
      const nextIds = exists
        ? prev.service_ids.filter((id) => id !== serviceId)
        : [...prev.service_ids, serviceId]
      return { ...prev, service_ids: nextIds }
    })
  }

  async function submitForm(event) {
    event.preventDefault()

    if (!form.customer_name.trim()) {
      alert('Nama pelanggan wajib diisi')
      return
    }
    if (!form.barber_id) {
      alert('Pilih barber terlebih dahulu')
      return
    }
    if (form.service_ids.length === 0) {
      alert('Pilih minimal satu layanan')
      return
    }
    if (!form.start_time) {
      alert('Pilih jam layanan yang tersedia')
      return
    }

    // Additional validation for time conflicts
    if (isMockMode) {
      const selectedServices = form.service_ids.map(id => serviceMap.get(id)).filter(Boolean);
      const totalDuration = selectedServices.reduce((sum, service) => sum + (service.duration_minutes || 30), 0);

      // Calculate end time
      const [hours, minutes] = form.start_time.split(':').map(Number);
      const endDate = new Date();
      endDate.setHours(hours, minutes + totalDuration);
      const endTime = endDate.toTimeString().slice(0, 5);

      // Check for conflicts with existing appointments
      const existingAppointments = loadAppointmentsFromStorage();
      const hasConflict = existingAppointments.some(apt => {
        if (apt.barber_id !== form.barber_id ||
            apt.appointment_date !== form.appointment_date ||
            apt.status === 'cancelled') {
          return false;
        }

        const newStart = new Date(`2000-01-01T${form.start_time}:00`);
        const newEnd = new Date(`2000-01-01T${endTime}:00`);
        const aptStart = new Date(`2000-01-01T${apt.start_time}:00`);
        const aptEnd = new Date(`2000-01-01T${apt.end_time}:00`);

        // Check for time overlap
        return (newStart < aptEnd && newEnd > aptStart);
      });

      if (hasConflict) {
        alert('Waktu yang dipilih sudah tidak tersedia. Silakan pilih waktu lain.');
        return;
      }
    }

    setFormSubmitting(true)

    if (isMockMode) {
      try {
        // Calculate end time based on service duration
        const selectedServices = form.service_ids.map(id => serviceMap.get(id)).filter(Boolean);
        const totalDuration = selectedServices.reduce((sum, service) => sum + (service.duration_minutes || 30), 0);
        const [hours, minutes] = form.start_time.split(':').map(Number);
        const endDate = new Date();
        endDate.setHours(hours, minutes + totalDuration);
        const endTime = endDate.toTimeString().slice(0, 5);

        const newAppointment = {
          id: `apt-${Date.now()}`,
          customer_name: form.customer_name.trim(),
          customer_phone: form.customer_phone?.trim() || null,
          barber_id: form.barber_id,
          service_ids: form.service_ids,
          appointment_date: form.appointment_date,
          start_time: form.start_time,
          end_time: endTime,
          status: 'scheduled',
          total_duration: totalDuration,
          total_price: totals.price,
          notes: form.notes?.trim() || null,
          created_at: new Date().toISOString()
        };

        // Update appointments in storage
        const currentAppointments = loadAppointmentsFromStorage();
        const updatedAppointments = [...currentAppointments, newAppointment];
        saveAppointmentsToStorage(updatedAppointments);

        setTimeout(() => {
          alert('Janji temu berhasil dibuat!');
          setFormOpen(false);
          setForm(defaultForm);
          loadAppointments(page);
        }, 500);
      } catch (error) {
        console.error('Error creating appointment in mock mode:', error);
        alert('Gagal membuat janji temu');
      } finally {
        setFormSubmitting(false);
      }
      return;
    }

    try {
      const payload = {
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone?.trim() || null,
        barber_id: form.barber_id, // Keep as string for mock compatibility
        appointment_date: form.appointment_date,
        start_time: form.start_time,
        service_ids: form.service_ids,
        notes: form.notes?.trim() || null,
      }
      const res = await apiPost('/barbershop/appointments', payload, token)
      alert(res.message || 'Janji temu berhasil dibuat')
      setFormOpen(false)
      setForm(defaultForm)
      loadAppointments(page)
    } catch (error) {
      console.error('Gagal membuat janji temu', error)
      alert(error.message || 'Tidak dapat menyimpan janji temu')
    } finally {
      setFormSubmitting(false)
    }
  }

  async function updateStatus(id, status) {
    setActionLoadingId(id)

    if (isMockMode) {
      try {
        const currentAppointments = loadAppointmentsFromStorage();
        const updatedAppointments = currentAppointments.map(apt => {
          if (apt.id === id) {
            const updatedApt = {
              ...apt,
              status,
              updated_at: new Date().toISOString()
            };

            // Add started_at timestamp when status changes to in_progress
            if (status === 'in_progress') {
              updatedApt.started_at = new Date().toISOString();
            }

            return updatedApt;
          }
          return apt;
        });
        saveAppointmentsToStorage(updatedAppointments);

        setTimeout(() => {
          alert('Status janji temu berhasil diperbarui!');
          loadAppointments(page);
        }, 300);
      } catch (error) {
        console.error('Error updating status in mock mode:', error);
        alert('Gagal memperbarui status');
      } finally {
        setActionLoadingId(null);
      }
      return;
    }

    try {
      const res = await apiPatch(`/barbershop/appointments/${id}`, { status }, token)
      alert(res.message || 'Status janji temu diperbarui')
      loadAppointments(page)
    } catch (error) {
      console.error('Tidak dapat memperbarui status', error)
      alert(error.message || 'Gagal memperbarui status')
    } finally {
      setActionLoadingId(null)
    }
  }

  async function cancelAppointment(id) {
    if (!confirm('Batalkan janji temu ini?')) return
    setActionLoadingId(id)

    if (isMockMode) {
      try {
        const currentAppointments = loadAppointmentsFromStorage();
        const updatedAppointments = currentAppointments.map(apt =>
          apt.id === id ? { ...apt, status: 'cancelled', updated_at: new Date().toISOString() } : apt
        );
        saveAppointmentsToStorage(updatedAppointments);

        setTimeout(() => {
          alert('Janji temu berhasil dibatalkan!');
          loadAppointments(page);
        }, 300);
      } catch (error) {
        console.error('Error cancelling appointment in mock mode:', error);
        alert('Gagal membatalkan janji temu');
      } finally {
        setActionLoadingId(null);
      }
      return;
    }

    try {
      const res = await apiPost(`/barbershop/appointments/${id}/cancel`, {}, token)
      alert(res.message || 'Janji temu berhasil dibatalkan')
      loadAppointments(page)
    } catch (error) {
      console.error('Tidak dapat membatalkan janji', error)
      alert(error.message || 'Gagal membatalkan janji temu')
    } finally {
      setActionLoadingId(null)
    }
  }

  function handlePayment(appointment) {
    // Navigate to ServicePOS with appointment data pre-filled
    const selectedServices = appointment.service_ids?.map(id => serviceMap.get(id)).filter(Boolean) || [];
    const selectedBarber = barbers.find(b => b.id === appointment.barber_id);

    // Create URL with query parameters for ServicePOS
    const appointmentData = {
      appointmentId: appointment.id,
      customerName: appointment.customer_name,
      customerPhone: appointment.customer_phone || '',
      barberId: appointment.barber_id,
      barberName: selectedBarber?.name || '',
      services: selectedServices.map(s => s.id).join(','),
      totalPrice: appointment.total_price,
      appointmentDate: appointment.appointment_date,
      startTime: appointment.start_time
    };

    const queryString = new URLSearchParams(appointmentData).toString();
    navigate(`/service-pos?${queryString}`);
  }

  async function completeAppointment(id) {
    if (!confirm('Tandai janji temu ini sebagai selesai?')) return
    setActionLoadingId(id)

    if (isMockMode) {
      try {
        const currentAppointments = loadAppointmentsFromStorage();
        const updatedAppointments = currentAppointments.map(apt =>
          apt.id === id ? { ...apt, status: 'completed', updated_at: new Date().toISOString() } : apt
        );
        saveAppointmentsToStorage(updatedAppointments);

        setTimeout(() => {
          alert('Janji temu berhasil diselesaikan!');
          loadAppointments(page);
        }, 300);
      } catch (error) {
        console.error('Error completing appointment in mock mode:', error);
        alert('Gagal menyelesaikan janji temu');
      } finally {
        setActionLoadingId(null);
      }
      return;
    }

    try {
      const res = await apiPost(`/barbershop/appointments/${id}/complete`, {}, token)
      alert(res.message || 'Janji temu ditandai selesai')
      loadAppointments(page)
    } catch (error) {
      console.error('Tidak dapat menyelesaikan janji temu', error)
      alert(error.message || 'Gagal menyelesaikan janji temu')
    } finally {
      setActionLoadingId(null)
    }
  }

  function resetFilters() {
    const reset = { date: today, status: 'semua', barber_id: 'all', search: '' }
    setFilters(reset)
    loadAppointments(1, reset)
  }

  function handleSearchSubmit(event) {
    event.preventDefault()
    loadAppointments(1)
  }

  function handlePageChange(nextPage) {
    if (nextPage < 1 || (meta.last_page && nextPage > meta.last_page)) return
    loadAppointments(nextPage)
  }

  function renderStatusBadge(appointment) {
    const statusConfig = {
      scheduled: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
      confirmed: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200',
      in_progress: 'bg-amber-100 text-amber-700 hover:bg-amber-200',
      paid: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
      completed: 'bg-green-100 text-green-700 hover:bg-green-200',
      cancelled: 'bg-red-100 text-red-700 hover:bg-red-200',
      no_show: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    }

    const cls = statusConfig[appointment.status] || 'bg-slate-100 text-slate-700 hover:bg-slate-200'
    const statusText = {
      scheduled: 'Terjadwal',
      confirmed: 'Dikonfirmasi',
      in_progress: 'Berlangsung',
      paid: 'Sudah Dibayar',
      completed: 'Selesai',
      cancelled: 'Dibatalkan',
      no_show: 'Tidak Hadir'
    }[appointment.status] || appointment.status

    return (
      <Badge className={`${cls} font-medium text-xs px-2 py-1 rounded-md border-0 transition-colors`}>
        {statusText}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Modern Header with Glass Effect */}
        <div className="relative mb-6">
          {/* Background Gradient - Barbershop Theme */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-slate-100 to-gray-100 rounded-2xl border border-gray-200/60" />

          {/* Header Card */}
          <div className="relative bg-white/90 backdrop-blur-sm border border-gray-200/70 rounded-2xl p-4 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              {/* Title Section */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                      <Calendar className="h-4 w-4 text-slate-600" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-slate-800 md:text-2xl">Manajemen Janji Temu</h1>
                      <p className="text-slate-600 text-sm">Kelola jadwal janji temu dan layanan pelanggan barbershop</p>
                    </div>
                  </div>
                </div>

                {/* Compact Stats Cards */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-2.5 border border-gray-200/60 shadow-sm">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="p-0.5 bg-blue-100 rounded">
                        <Calendar className="h-3 w-3 text-blue-600" />
                      </div>
                      <span className="text-xs text-slate-700 font-medium">Total</span>
                    </div>
                    <div className="text-lg font-bold text-slate-800">{summary.total || 0}</div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-2.5 border border-gray-200/60 shadow-sm">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="p-0.5 bg-green-100 rounded">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      </div>
                      <span className="text-xs text-slate-700 font-medium">Terkonfirmasi</span>
                    </div>
                    <div className="text-lg font-bold text-slate-800">{summary.confirmed || 0}</div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-2.5 border border-gray-200/60 shadow-sm">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="p-0.5 bg-amber-100 rounded">
                        <Play className="h-3 w-3 text-amber-600" />
                      </div>
                      <span className="text-xs text-slate-700 font-medium">Berlangsung</span>
                    </div>
                    <div className="text-lg font-bold text-slate-800">{summary.in_progress || 0}</div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-2.5 border border-gray-200/60 shadow-sm">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="p-0.5 bg-slate-100 rounded">
                        <Users className="h-3 w-3 text-slate-600" />
                      </div>
                      <span className="text-xs text-slate-700 font-medium">Pendapatan</span>
                    </div>
                    <div className="text-lg font-bold text-slate-800">
                      {formatRupiah(summary.revenue_today || 0)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 lg:flex-col lg:items-end">
                <Button
                  variant="outline"
                  onClick={() => loadAppointments(page)}
                  className="flex items-center gap-2 hover:bg-gray-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  Muat Ulang
                </Button>
                <Button
                  onClick={openFormModal}
                  className="bg-slate-800 text-white hover:bg-slate-700 font-medium flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Buat Janji Temu
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Section - Modern Design */}
        <div className="bg-white/90 backdrop-blur-sm border border-gray-200/70 rounded-2xl p-4 shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                <Filter className="h-3 w-3 text-slate-600" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">Filter & Pencarian</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-5">
          <div className="space-y-2">
            <Label>Tanggal</Label>
            <Input
              type="date"
              value={filters.date}
              onChange={(e) => handleFilterChange('date', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Barber</Label>
            <Select value={filters.barber_id} onValueChange={(value) => handleFilterChange('barber_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Semua barber" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua barber</SelectItem>
                {barbers.map((barber) => (
                  <SelectItem key={barber.id} value={String(barber.id)}>
                    {barber.name || barber.user?.name || barber.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <form className="space-y-2" onSubmit={handleSearchSubmit}>
            <Label>Cari Pelanggan</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Nama atau nomor telepon"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
              <Button type="submit" variant="outline" className="shrink-0">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </form>
          <div className="flex items-end">
            <Button variant="ghost" onClick={resetFilters} className="text-sm">
              Atur Ulang Filter
            </Button>
          </div>
            </div>
          </div>
        </div>

        {/* Appointments Table - Modern Design */}
        <div className="bg-white/90 backdrop-blur-sm border border-gray-200/70 rounded-2xl shadow-sm">
          <div className="p-4 border-b border-gray-200/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                  <Calendar className="h-3 w-3 text-slate-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Daftar Janji Temu</h3>
                  <p className="text-xs text-slate-600">Kelola dan pantau status janji temu pelanggan</p>
                </div>
              </div>
              <div className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                {meta.total ?? appointments.length} total
              </div>
            </div>
          </div>

          <div className="p-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner label="Memuat janji temu..." />
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Belum ada data janji temu untuk filter yang dipilih.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Pelanggan</TableHead>
                    <TableHead>Barber</TableHead>
                    <TableHead>Layanan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Durasi</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.map((appointment) => (
                    <TableRow key={appointment.id} className="align-top">
                      <TableCell>
                        <div className="font-semibold text-gray-900">{appointment.appointment_date}</div>
                        <div className="text-sm text-gray-600">{appointment.start_time} - {appointment.end_time}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium flex items-center gap-2">
                          <UserIcon className="h-4 w-4 text-gray-400" />
                          {appointment.customer_name}
                        </div>
                        {appointment.customer_phone && (
                          <div className="text-sm text-gray-500 flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            {appointment.customer_phone}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{appointment.barber?.name || barbers.find(b => b.id === appointment.barber_id)?.name || '-'}</div>
                        <div className="text-xs text-gray-500 capitalize">{appointment.barber?.skill_level || barbers.find(b => b.id === appointment.barber_id)?.specialty || ''}</div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {appointment.service_ids?.length ? (
                            appointment.service_ids.map((serviceId) => {
                              const service = serviceMap.get(serviceId);
                              return service ? (
                                <div key={service.id} className="flex items-center gap-2 text-sm">
                                  <Scissors className="h-3 w-3 text-purple-400" />
                                  <span>{service.name}</span>
                                </div>
                              ) : null;
                            })
                          ) : (
                            <div className="text-sm text-gray-400">-</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {renderStatusBadge(appointment)}
                          {appointment.status === 'in_progress' && (
                            <CountdownTimer appointment={appointment} />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{appointment.total_duration || totals.duration} menit</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-800">{formatRupiah(appointment.total_price || totals.price)}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          {appointment.status === 'scheduled' && (
                            <Button
                              size="sm"
                              className="bg-emerald-500 hover:bg-emerald-600 text-white border-0"
                              disabled={actionLoadingId === appointment.id}
                              onClick={() => updateStatus(appointment.id, 'confirmed')}
                            >
                              <Play className="h-3 w-3 mr-1" />
                              Konfirmasi
                            </Button>
                          )}
                          {appointment.status === 'confirmed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-blue-700 border-blue-300 hover:bg-blue-50"
                              disabled={actionLoadingId === appointment.id}
                              onClick={() => updateStatus(appointment.id, 'in_progress')}
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              Mulai
                            </Button>
                          )}
                          {appointment.status === 'in_progress' && (
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              disabled={actionLoadingId === appointment.id}
                              onClick={() => handlePayment(appointment)}
                            >
                              <DollarSign className="h-3 w-3 mr-1" />
                              Bayar
                            </Button>
                          )}
                          {appointment.status === 'paid' && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              disabled={actionLoadingId === appointment.id}
                              onClick={() => completeAppointment(appointment.id)}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Selesai
                            </Button>
                          )}
                          {['scheduled', 'confirmed', 'in_progress', 'paid'].includes(appointment.status) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:bg-red-50"
                              disabled={actionLoadingId === appointment.id}
                              onClick={() => cancelAppointment(appointment.id)}
                            >
                              <Ban className="h-3 w-3 mr-1" />
                              Batalkan
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-gray-500">
                  Halaman {meta.current_page ?? page} dari {meta.last_page ?? 1}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange((meta.current_page ?? page) - 1)}
                    disabled={(meta.current_page ?? page) <= 1}
                  >
                    Sebelumnya
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange((meta.current_page ?? page) + 1)}
                    disabled={meta.last_page ? (meta.current_page ?? page) >= meta.last_page : true}
                  >
                    Berikutnya
                  </Button>
                </div>
              </div>
            </>
          )}
          </div>
        </div>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[80vw]">
          <DialogHeader className="space-y-3 pb-4 border-b border-gray-200">
            <div className="flex items-start sm:items-center gap-3 flex-col sm:flex-row">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                <Plus className="h-4 w-4 text-slate-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-800">Buat Janji Temu Baru</DialogTitle>
                <DialogDescription className="text-sm text-slate-600">
                  Lengkapi informasi pelanggan, pilih layanan yang diinginkan, dan tentukan jadwal kunjungan
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={submitForm} className="space-y-6">
            {/* Customer Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                <div className="w-5 h-5 bg-slate-100 rounded flex items-center justify-center">
                  <UserIcon className="h-3 w-3 text-slate-600" />
                </div>
                <h4 className="text-sm font-semibold text-slate-700">Informasi Pelanggan</h4>
              </div>
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Nama Pelanggan *</Label>
                  <Input
                    placeholder="Masukkan nama lengkap pelanggan"
                    value={form.customer_name}
                    onChange={(e) => setForm((prev) => ({ ...prev, customer_name: e.target.value }))}
                    className="border-gray-200 focus:border-slate-300 focus:ring-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Nomor Telepon</Label>
                  <Input
                    placeholder="Contoh: 081234567890"
                    value={form.customer_phone}
                    onChange={(e) => setForm((prev) => ({ ...prev, customer_phone: e.target.value }))}
                    className="border-gray-200 focus:border-slate-300 focus:ring-slate-200"
                  />
                  <p className="text-xs text-gray-500">Opsional - untuk konfirmasi janji temu</p>
                </div>
              </div>
            </div>

            {/* Appointment Details Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                <div className="w-5 h-5 bg-slate-100 rounded flex items-center justify-center">
                  <Calendar className="h-3 w-3 text-slate-600" />
                </div>
                <h4 className="text-sm font-semibold text-slate-700">Detail Janji Temu</h4>
              </div>
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Pilih Barber *</Label>
                  <Select
                    value={form.barber_id || ''}
                    onValueChange={(value) => setForm((prev) => ({ ...prev, barber_id: value === 'none' ? '' : value }))}
                  >
                    <SelectTrigger className="border-gray-200 focus:border-slate-300">
                      <SelectValue placeholder="Pilih barber yang tersedia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <div className="flex items-center gap-2 text-gray-500">
                          <UserIcon className="h-4 w-4" />
                          Belum ditentukan
                        </div>
                      </SelectItem>
                      {barbers.map((barber) => {
                        // Check if barber is available on selected date
                        const selectedDate = new Date(form.appointment_date);
                        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                        const dayName = dayNames[selectedDate.getDay()];
                        const barberSchedule = barber.schedule?.[dayName];
                        const isAvailable = barberSchedule && barberSchedule !== 'off';

                        return (
                          <SelectItem key={barber.id} value={String(barber.id)} disabled={!isAvailable}>
                            <div className="flex items-center gap-2">
                              <UserIcon className={`h-4 w-4 ${isAvailable ? 'text-gray-400' : 'text-red-400'}`} />
                              <div className="flex flex-col">
                                <span className={isAvailable ? '' : 'text-gray-400'}>{barber.name}</span>
                                <span className="text-xs text-gray-500">
                                  {barber.specialty}
                                  {!isAvailable && ' - Tidak tersedia hari ini'}
                                  {isAvailable && barberSchedule && ` (${barberSchedule.start}-${barberSchedule.end})`}
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Tanggal Kunjungan *</Label>
                  <Input
                    type="date"
                    value={form.appointment_date}
                    min={today}
                    onChange={(e) => setForm((prev) => ({ ...prev, appointment_date: e.target.value }))}
                    className="border-gray-200 focus:border-slate-300 focus:ring-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Waktu Layanan *</Label>
                  <Select
                  value={form.start_time || ''}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, start_time: value }))}
                  disabled={slotsLoading || availableSlots.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={slotsLoading ? 'Mengambil slot...' : 'Pilih jam tersedia'} />
                  </SelectTrigger>
                  <SelectContent>
                    {slotsLoading ? (
                      <SelectItem value="__loading" disabled>
                        Mengambil slot tersedia...
                      </SelectItem>
                    ) : availableSlots.length === 0 ? (
                      <SelectItem value="__empty" disabled>
                        Belum ada slot tersedia
                      </SelectItem>
                    ) : (
                      availableSlots.map((slot) => (
                        <SelectItem key={slot.start} value={slot.start}>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span>{slot.start} - {slot.end}</span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                  {availableSlots.length > 0 ? (
                    <p className="text-xs text-green-600">
                      ✓ {availableSlots.length} slot tersedia untuk layanan {totals.duration} menit
                    </p>
                  ) : form.barber_id && form.service_ids.length > 0 && form.appointment_date ? (
                    <p className="text-xs text-red-600">
                      ✗ Tidak ada slot tersedia untuk kombinasi barber, layanan, dan tanggal ini
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500">
                      Slot akan ditampilkan setelah memilih barber, layanan, dan tanggal
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold text-gray-700">Pilih Layanan</Label>
                  <p className="text-xs text-gray-500">
                    Centang layanan yang akan dilakukan pada janji temu ini.
                  </p>
                </div>
                <div className="max-h-64 space-y-3 overflow-auto rounded-lg border border-gray-200 p-3">
                  {Object.entries(servicesByCategory).map(([category, items]) => (
                    <div key={category} className="space-y-2">
                      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{category}</div>
                      <div className="space-y-2">
                        {items.map((service) => (
                          <label
                            key={service.id}
                            className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 hover:border-slate-300"
                          >
                            <Checkbox
                              checked={form.service_ids.includes(service.id)}
                              onCheckedChange={() => toggleService(service.id)}
                            />
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{service.name}</div>
                              {service.description && (
                                <div className="text-xs text-gray-500">{service.description}</div>
                              )}
                              <div className="mt-1 flex gap-2 text-xs text-gray-500">
                                <Badge variant="secondary">{service.duration_minutes} menit</Badge>
                                <Badge variant="outline">{formatRupiah(service.price)}</Badge>
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <div className="w-5 h-5 bg-slate-100 rounded flex items-center justify-center">
                      <CheckCircle className="h-3 w-3 text-slate-600" />
                    </div>
                    <h4 className="text-sm font-semibold text-slate-700">Catatan & Ringkasan</h4>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Catatan untuk barber (opsional)</Label>
                    <Textarea
                      rows={5}
                      placeholder="Tulis permintaan khusus pelanggan atau catatan penting lainnya"
                      value={form.notes}
                      onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                      className="border-gray-200 focus:border-slate-300 focus:ring-slate-200"
                    />
                  </div>

                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-4 h-4 bg-emerald-200 rounded flex items-center justify-center">
                        <CheckCircle className="h-3 w-3 text-emerald-700" />
                      </div>
                      <div className="text-sm font-semibold text-emerald-700">Ringkasan Pemesanan</div>
                    </div>
                    <div className="space-y-2 text-sm text-emerald-900">
                      <div className="flex justify-between items-center">
                        <span>Total Durasi:</span>
                        <span className="font-medium">{totals.duration} menit</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Total Biaya:</span>
                        <span className="font-semibold text-emerald-800">{formatRupiah(totals.price)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Jumlah Layanan:</span>
                        <span className="font-medium">{form.service_ids.length} layanan</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
                className="w-full sm:w-auto"
              >
                Tutup
              </Button>
              <Button
                type="submit"
                disabled={formSubmitting}
                className="bg-slate-800 text-white hover:bg-slate-700 font-medium w-full sm:w-auto"
              >
                {formSubmitting ? 'Menyimpan...' : 'Simpan Janji Temu'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}























