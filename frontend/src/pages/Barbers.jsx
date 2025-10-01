import { useEffect, useState } from 'react'
import { useAuth } from '../AuthContext'
import { apiGet, apiPost, apiPatch, apiDelete } from '../api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Badge } from '../components/ui/badge'
import { Textarea } from '../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { LoadingSpinner } from '../components/ui/loading'
import {
  Users,
  User as UserIcon,
  Phone,
  Scissors,
  Plus,
  Search,
  RefreshCw,
  Edit,
  Trash2,
  Star,
  Clock,
  Award,
  Calendar,
  Filter,
  CheckCircle
} from 'lucide-react'

// Import shared utilities
import { loadBarbersFromStorage, saveBarbersToStorage, getDefaultBarbers } from '../utils/barbershopData'

// Using shared barber data and utilities

const defaultForm = {
  name: '',
  specialty: '',
  experience_years: 1,
  phone: '',
  email: '',
  skills: [],
  hourly_rate: 50000,
  bio: '',
  active: true
}

export default function Barbers() {
  const { token } = useAuth()
  const isMockMode = import.meta.env.VITE_MOCK_BARBERSHOP === "true" || true;
  const [loading, setLoading] = useState(false)
  const [barbers, setBarbers] = useState([])
  const [filteredBarbers, setFilteredBarbers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editingBarber, setEditingBarber] = useState(null)
  const [form, setForm] = useState(defaultForm)
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  useEffect(() => {
    loadBarbers();

    // Listen for localStorage changes (when barber data is updated from Treatment page)
    const handleStorageChange = (e) => {
      if (e.key === 'barbershop_barbers') {
        console.log('Barber data updated in localStorage, refreshing...')
        loadBarbers()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  useEffect(() => {
    filterBarbers();
  }, [barbers, searchTerm, statusFilter])

  function filterBarbers() {
    let filtered = [...barbers];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(barber =>
        barber.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        barber.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
        barber.phone.includes(searchTerm)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(barber =>
        statusFilter === 'active' ? barber.active : !barber.active
      );
    }

    setFilteredBarbers(filtered);
  }

  async function loadBarbers() {
    setLoading(true)

    if (isMockMode) {
      setTimeout(() => {
        const storedBarbers = loadBarbersFromStorage();
        setBarbers(storedBarbers);
        setLoading(false);
      }, 300);
      return;
    }

    try {
      const result = await apiGet('/setup/barbers', token)
      setBarbers(result.data || [])
    } catch (error) {
      console.error('Gagal memuat data barber', error)
      // Fallback to stored data
      const storedBarbers = loadBarbersFromStorage();
      setBarbers(storedBarbers);
    } finally {
      setLoading(false)
    }
  }

  function openFormModal(barber = null) {
    if (barber) {
      setEditingBarber(barber)
      setForm({
        name: barber.name,
        specialty: barber.specialty,
        experience_years: barber.experience_years,
        phone: barber.phone,
        email: barber.email || '',
        skills: barber.skills || [],
        hourly_rate: barber.hourly_rate || 50000,
        bio: barber.bio || '',
        active: barber.active
      })
    } else {
      setEditingBarber(null)
      setForm(defaultForm)
    }
    setFormOpen(true)
  }

  async function submitForm(event) {
    event.preventDefault()

    if (!form.name.trim()) {
      alert('Nama barber wajib diisi')
      return
    }
    if (!form.specialty.trim()) {
      alert('Spesialisasi barber wajib diisi')
      return
    }

    setFormSubmitting(true)

    try {
      const payload = {
        name: form.name.trim(),
        specialty: form.specialty.trim(),
        experience_years: Number(form.experience_years),
        phone: form.phone?.trim() || null,
        email: form.email?.trim() || null,
        skills: form.skills,
        hourly_rate: Number(form.hourly_rate),
        bio: form.bio?.trim() || null,
        active: form.active,
      }

      if (isMockMode) {
        const currentBarbers = loadBarbersFromStorage();

        if (editingBarber) {
          // Update existing barber
          const updatedBarbers = currentBarbers.map(barber =>
            barber.id === editingBarber.id
              ? { ...barber, ...payload, updated_at: new Date().toISOString() }
              : barber
          );
          saveBarbersToStorage(updatedBarbers);
          setBarbers(updatedBarbers);
        } else {
          // Create new barber
          const newBarber = {
            id: `barber-${Date.now()}`,
            ...payload,
            rating: 0,
            total_appointments: 0,
            completed_appointments: 0,
            schedule: {
              monday: { start: "09:00", end: "17:00" },
              tuesday: { start: "09:00", end: "17:00" },
              wednesday: { start: "09:00", end: "17:00" },
              thursday: { start: "09:00", end: "17:00" },
              friday: { start: "09:00", end: "17:00" },
              saturday: { start: "09:00", end: "15:00" },
              sunday: "off"
            },
            created_at: new Date().toISOString()
          };
          const updatedBarbers = [...currentBarbers, newBarber];
          saveBarbersToStorage(updatedBarbers);
          setBarbers(updatedBarbers);
        }

        alert(editingBarber ? 'Data barber berhasil diperbarui' : 'Barber baru berhasil ditambahkan');
      } else {
        // Real API call
        if (editingBarber) {
          const res = await apiPatch(`/barbershop/barbers/${editingBarber.id}`, payload, token)
          alert(res.message || 'Data barber berhasil diperbarui')
        } else {
          const res = await apiPost('/barbershop/barbers', payload, token)
          alert(res.message || 'Barber baru berhasil ditambahkan')
        }
        loadBarbers()
      }

      setFormOpen(false)
      setForm(defaultForm)
      setEditingBarber(null)
    } catch (error) {
      console.error('Gagal menyimpan data barber', error)
      alert(error.message || 'Tidak dapat menyimpan data barber')
    } finally {
      setFormSubmitting(false)
    }
  }

  async function deleteBarber(barber) {
    if (isMockMode) {
      const currentBarbers = loadBarbersFromStorage();
      const updatedBarbers = currentBarbers.filter(b => b.id !== barber.id);
      saveBarbersToStorage(updatedBarbers);
      setBarbers(updatedBarbers);
      alert('Data barber berhasil dihapus');
    } else {
      try {
        const res = await apiDelete(`/barbershop/barbers/${barber.id}`, token)
        alert(res.message || 'Data barber berhasil dihapus')
        loadBarbers()
      } catch (error) {
        console.error('Gagal menghapus barber', error)
        alert(error.message || 'Tidak dapat menghapus data barber')
      }
    }
    setDeleteConfirm(null)
  }

  async function toggleBarberStatus(barber) {
    const newStatus = !barber.active;

    if (isMockMode) {
      const currentBarbers = loadBarbersFromStorage();
      const updatedBarbers = currentBarbers.map(b =>
        b.id === barber.id
          ? { ...b, active: newStatus, updated_at: new Date().toISOString() }
          : b
      );
      saveBarbersToStorage(updatedBarbers);
      setBarbers(updatedBarbers);
      alert(`Barber ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}`);
    } else {
      try {
        const res = await apiPatch(`/barbershop/barbers/${barber.id}`, { active: newStatus }, token)
        alert(res.message || `Barber ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}`)
        loadBarbers()
      } catch (error) {
        console.error('Gagal mengubah status barber', error)
        alert(error.message || 'Tidak dapat mengubah status barber')
      }
    }
  }

  function addSkill(skill) {
    if (skill && !form.skills.includes(skill)) {
      setForm(prev => ({ ...prev, skills: [...prev.skills, skill] }))
    }
  }

  function removeSkill(skillToRemove) {
    setForm(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }))
  }

  function formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Modern Header with Glass Effect */}
        <div className="relative mb-6">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-slate-100 to-gray-100 rounded-2xl border border-gray-200/60" />

          {/* Header Card */}
          <div className="relative bg-white/90 backdrop-blur-sm border border-gray-200/70 rounded-2xl p-4 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              {/* Title Section */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                      <Users className="h-4 w-4 text-slate-600" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-slate-800 md:text-2xl">Kelola Barber</h1>
                      <p className="text-slate-600 text-sm">Manajemen data barber dan karyawan barbershop</p>
                    </div>
                  </div>
                </div>

                {/* Compact Stats Cards */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-2.5 border border-gray-200/60 shadow-sm">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="p-0.5 bg-blue-100 rounded">
                        <Users className="h-3 w-3 text-blue-600" />
                      </div>
                      <span className="text-xs text-slate-700 font-medium">Total</span>
                    </div>
                    <div className="text-lg font-bold text-slate-800">{barbers.length}</div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-2.5 border border-gray-200/60 shadow-sm">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="p-0.5 bg-green-100 rounded">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      </div>
                      <span className="text-xs text-slate-700 font-medium">Aktif</span>
                    </div>
                    <div className="text-lg font-bold text-slate-800">
                      {barbers.filter(b => b.active).length}
                    </div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-2.5 border border-gray-200/60 shadow-sm">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="p-0.5 bg-purple-100 rounded">
                        <Scissors className="h-3 w-3 text-purple-600" />
                      </div>
                      <span className="text-xs text-slate-700 font-medium">Pengalaman Rata-rata</span>
                    </div>
                    <div className="text-lg font-bold text-slate-800">
                      {barbers.length > 0
                        ? (barbers.reduce((sum, b) => sum + (b.experience_years || 0), 0) / barbers.length).toFixed(1)
                        : '0.0'
                      } tahun
                    </div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-2.5 border border-gray-200/60 shadow-sm">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="p-0.5 bg-slate-100 rounded">
                        <Calendar className="h-3 w-3 text-slate-600" />
                      </div>
                      <span className="text-xs text-slate-700 font-medium">Total Layanan</span>
                    </div>
                    <div className="text-lg font-bold text-slate-800">
                      {barbers.reduce((sum, b) => sum + (b.completed_appointments || 0), 0)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 lg:flex-col lg:items-end">
                <Button
                  variant="outline"
                  onClick={loadBarbers}
                  className="flex items-center gap-2 hover:bg-gray-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  Muat Ulang
                </Button>
                <Button
                  onClick={() => openFormModal()}
                  className="bg-slate-800 text-white hover:bg-slate-700 font-medium flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Tambah Barber
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white/90 backdrop-blur-sm border border-gray-200/70 rounded-2xl p-4 shadow-sm mb-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                <Filter className="h-3 w-3 text-slate-600" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">Filter & Pencarian</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Cari Barber</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Nama, spesialisasi, atau nomor telepon"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-200 focus:border-slate-300 focus:ring-slate-200"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="border-gray-200 focus:border-slate-300">
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="inactive">Tidak Aktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="ghost"
                  onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                  className="text-sm"
                >
                  Reset Filter
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Barbers Table */}
        <div className="bg-white/90 backdrop-blur-sm border border-gray-200/70 rounded-2xl shadow-sm">
          <div className="p-4 border-b border-gray-200/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                  <Users className="h-3 w-3 text-slate-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Daftar Barber</h3>
                  <p className="text-xs text-slate-600">Kelola data dan informasi barber</p>
                </div>
              </div>
              <div className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                {filteredBarbers.length} dari {barbers.length} barber
              </div>
            </div>
          </div>

          <div className="p-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner label="Memuat data barber..." />
              </div>
            ) : filteredBarbers.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                {searchTerm || statusFilter !== 'all'
                  ? 'Tidak ada barber yang sesuai dengan filter.'
                  : 'Belum ada data barber. Tambahkan barber pertama Anda.'
                }
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Barber</TableHead>
                    <TableHead>Spesialisasi</TableHead>
                    <TableHead>Pengalaman</TableHead>
                    <TableHead>Tarif per Layanan</TableHead>
                    <TableHead>Kontak</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBarbers.map((barber) => (
                    <TableRow key={barber.id} className="align-top">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                            <UserIcon className="h-5 w-5 text-slate-600" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-800">{barber.name}</div>
                            <div className="text-sm text-slate-500">
                              {barber.completed_appointments || 0} layanan selesai
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-700">{barber.specialty}</div>
                        {barber.skills && barber.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {barber.skills.slice(0, 2).map((skill, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {barber.skills.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{barber.skills.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-amber-500" />
                          <span className="font-medium">{barber.experience_years} tahun</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-700">
                          {formatRupiah(barber.hourly_rate || 0)}
                        </div>
                        <div className="text-xs text-slate-500">per layanan</div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {barber.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-3 w-3 text-slate-400" />
                              <span>{barber.phone}</span>
                            </div>
                          )}
                          {barber.email && (
                            <div className="text-sm text-slate-500">{barber.email}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${barber.active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                          } font-medium text-xs px-2 py-1 rounded-md border-0`}
                        >
                          {barber.active ? 'Aktif' : 'Tidak Aktif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openFormModal(barber)}
                            className="h-8"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant={barber.active ? "ghost" : "outline"}
                            onClick={() => toggleBarberStatus(barber)}
                            className={`h-8 ${barber.active
                              ? 'text-red-600 hover:bg-red-50'
                              : 'text-green-600 hover:bg-green-50'
                            }`}
                          >
                            {barber.active ? 'Nonaktifkan' : 'Aktifkan'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteConfirm(barber)}
                            className="h-8 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                <UserIcon className="h-4 w-4 text-slate-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-800">
                  {editingBarber ? 'Edit Data Barber' : 'Tambah Barber Baru'}
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-600">
                  {editingBarber
                    ? 'Perbarui informasi data barber'
                    : 'Lengkapi informasi barber baru untuk bergabung dengan tim'
                  }
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={submitForm} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                <div className="w-5 h-5 bg-slate-100 rounded flex items-center justify-center">
                  <UserIcon className="h-3 w-3 text-slate-600" />
                </div>
                <h4 className="text-sm font-semibold text-slate-700">Informasi Dasar</h4>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Nama Lengkap *</Label>
                  <Input
                    placeholder="Masukkan nama lengkap barber"
                    value={form.name}
                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                    className="border-gray-200 focus:border-slate-300 focus:ring-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Spesialisasi *</Label>
                  <Input
                    placeholder="Contoh: Classic & Modern Cut"
                    value={form.specialty}
                    onChange={(e) => setForm(prev => ({ ...prev, specialty: e.target.value }))}
                    className="border-gray-200 focus:border-slate-300 focus:ring-slate-200"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Pengalaman (Tahun)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    value={form.experience_years}
                    onChange={(e) => setForm(prev => ({ ...prev, experience_years: parseInt(e.target.value) || 1 }))}
                    className="border-gray-200 focus:border-slate-300 focus:ring-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Tarif per Jam</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1000"
                    value={form.hourly_rate}
                    onChange={(e) => setForm(prev => ({ ...prev, hourly_rate: parseInt(e.target.value) || 0 }))}
                    className="border-gray-200 focus:border-slate-300 focus:ring-slate-200"
                  />
                  <p className="text-xs text-gray-500">
                    Saat ini: {formatRupiah(form.hourly_rate)}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                <div className="w-5 h-5 bg-slate-100 rounded flex items-center justify-center">
                  <Phone className="h-3 w-3 text-slate-600" />
                </div>
                <h4 className="text-sm font-semibold text-slate-700">Informasi Kontak</h4>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Nomor Telepon</Label>
                  <Input
                    placeholder="Contoh: 081234567890"
                    value={form.phone}
                    onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="border-gray-200 focus:border-slate-300 focus:ring-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Email</Label>
                  <Input
                    type="email"
                    placeholder="barber@barbershop.com"
                    value={form.email}
                    onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                    className="border-gray-200 focus:border-slate-300 focus:ring-slate-200"
                  />
                </div>
              </div>
            </div>

            {/* Skills and Bio */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                <div className="w-5 h-5 bg-slate-100 rounded flex items-center justify-center">
                  <Scissors className="h-3 w-3 text-slate-600" />
                </div>
                <h4 className="text-sm font-semibold text-slate-700">Keahlian & Bio</h4>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Keahlian</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {form.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="ml-1 text-xs hover:text-red-600"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Tambah keahlian (tekan Enter)"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addSkill(e.target.value.trim())
                          e.target.value = ''
                        }
                      }}
                      className="border-gray-200 focus:border-slate-300 focus:ring-slate-200"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Contoh: Classic Cut, Modern Fade, Beard Styling
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Bio/Deskripsi</Label>
                  <Textarea
                    rows={3}
                    placeholder="Ceritakan tentang pengalaman dan keahlian barber..."
                    value={form.bio}
                    onChange={(e) => setForm(prev => ({ ...prev, bio: e.target.value }))}
                    className="border-gray-200 focus:border-slate-300 focus:ring-slate-200"
                  />
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                <div className="w-5 h-5 bg-slate-100 rounded flex items-center justify-center">
                  <CheckCircle className="h-3 w-3 text-slate-600" />
                </div>
                <h4 className="text-sm font-semibold text-slate-700">Status</h4>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Status Keaktifan</Label>
                <Select
                  value={form.active ? 'active' : 'inactive'}
                  onValueChange={(value) => setForm(prev => ({ ...prev, active: value === 'active' }))}
                >
                  <SelectTrigger className="border-gray-200 focus:border-slate-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktif - Dapat menerima appointment</SelectItem>
                    <SelectItem value="inactive">Tidak Aktif - Tidak dapat menerima appointment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Batal
              </Button>
              <Button
                type="submit"
                disabled={formSubmitting}
                className="bg-slate-800 text-white hover:bg-slate-700 font-medium"
              >
                {formSubmitting
                  ? 'Menyimpan...'
                  : editingBarber
                    ? 'Perbarui Data'
                    : 'Tambah Barber'
                }
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus barber <strong>{deleteConfirm?.name}</strong>?
              <br />
              <span className="text-red-600 text-sm">
                Tindakan ini tidak dapat dibatalkan.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteBarber(deleteConfirm)}
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}