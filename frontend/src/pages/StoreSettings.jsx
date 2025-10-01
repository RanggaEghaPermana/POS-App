import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { apiGet } from '../api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Badge } from '../components/ui/badge'
import { Label } from '../components/ui/label'
import { Switch } from '../components/ui/switch'
import {
  Store, Settings, Save, Clock, DollarSign, Receipt,
  Printer, Home, CheckCircle, AlertCircle, Scissors,
  Users, Calendar, Star
} from 'lucide-react'

export default function StoreSettings(){
  const { token, logout } = useAuth()
  const defaultData = {
    store:{
      name:'Barbershop',
      business_hours:'08:00 - 22:00',
      address:'',
      phone:'',
      email:'',
      npwp:'',
      nib:'',
      logo_url:'',
      specialty:'ALTA POS',
      instagram:'',
      whatsapp:''
    },
    currency:'IDR',
    pricing:{rounding:'none', rounding_mode:'normal'},
    branding:{primary_color:'#475569'},
    fx:{enabled:false,target:'USD',rate:''},
    tax:{enabled:false,rate:0},
    receipt:{footer:'Terima kasih atas kunjungan Anda\nPelayanan yang sudah diberikan\ntidak dapat dikembalikan'},
    printer:{type:'thermal', width:58},
    barbershop:{
      appointment_duration:60,
      booking_enabled:true,
      walk_in_enabled:true,
      rating_enabled:true,
      photo_enabled:true
    }
  }
  const cached = (()=>{ try{ return window.__APP_SETTINGS__ || JSON.parse(localStorage.getItem('app_settings_cache')||'{}').value || null }catch{return null} })()
  const [data, setData] = useState(cached || defaultData)
  const [saving, setSaving] = useState(false)
  const [syncingFx, setSyncingFx] = useState(false)
  const [loading, setLoading] = useState(!cached)

  async function load(){
    const isMockMode = import.meta.env.VITE_MOCK_BARBERSHOP === "true" || true

    if (isMockMode || !token) {
      // Use mock settings for barbershop
      try {
        const savedSettings = localStorage.getItem('barbershop_settings')
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings)
          // Force update old "Barbershop Utama" to "Barbershop"
          if (parsed.store?.name === 'Barbershop Utama') {
            parsed.store.name = 'Barbershop'
            localStorage.setItem('barbershop_settings', JSON.stringify(parsed))
          }
          setData(parsed)
        } else {
          setData(defaultData)
          // Save default settings to localStorage
          localStorage.setItem('barbershop_settings', JSON.stringify(defaultData))
          // Also clear any cached settings that might have old name
          localStorage.removeItem('app_settings_cache')
        }
      } catch (e) {
        console.warn('Error loading barbershop settings:', e)
        setData(defaultData)
      }
      setLoading(false)
      return
    }

    // API mode
    try{
      const settings = await apiGet('/settings', token)
      setData(settings)
      try {
        window.__APP_SETTINGS__ = settings
        localStorage.setItem('app_settings_cache', JSON.stringify({ value: settings, at: Date.now() }))
      } catch {}
    } catch (e) {
      console.warn('API not available, using mock settings:', e)
      // Fallback to mock mode
      const savedSettings = localStorage.getItem('barbershop_settings')
      if (savedSettings) {
        setData(JSON.parse(savedSettings))
      } else {
        setData(defaultData)
      }
    } finally {
      setLoading(false)
    }
  }
  async function save(){
    setSaving(true)
    const isMockMode = import.meta.env.VITE_MOCK_BARBERSHOP === "true" || true

    if (isMockMode || !token) {
      // Save to localStorage for mock mode
      try {
        localStorage.setItem('barbershop_settings', JSON.stringify(data))
        // Also save to window for immediate use
        window.__APP_SETTINGS__ = data
        window.__BARBERSHOP_SETTINGS__ = data

        // Notify other components about settings update
        try {
          window.dispatchEvent(new CustomEvent('app:settings-updated', { detail: data }))
          window.dispatchEvent(new CustomEvent('barbershop:settings-updated', { detail: data }))
        } catch {}

        alert('Pengaturan barbershop tersimpan!')
      } catch (e) {
        alert('Gagal menyimpan pengaturan: ' + e.message)
      }
      setSaving(false)
      return
    }

    // API mode
    try{
      const base = import.meta.env.VITE_API_BASE || 'http://localhost/api/v1'
      const res = await fetch(`${base}/settings`, { method:'PUT', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify(data) })
      const updated = await res.json().catch(()=>({}))
      if(!res.ok){ throw new Error(updated.message||'Gagal simpan') }
      // Sinkronkan state lokal dengan hasil dari server
      setData(updated)
      // Cache ke window dan localStorage untuk render instan di halaman lain
      try {
        window.__APP_SETTINGS__ = updated
        localStorage.setItem('app_settings_cache', JSON.stringify({ value: updated, at: Date.now() }))
        localStorage.setItem('barbershop_settings', JSON.stringify(updated))
      } catch {}
      // Beritahu halaman lain agar refresh config tanpa reload
      try { window.dispatchEvent(new CustomEvent('app:settings-updated', { detail: updated })) } catch {}
      alert('Tersimpan')
    }catch(e){
      // Fallback to localStorage
      console.warn('API save failed, saving to localStorage:', e)
      try {
        localStorage.setItem('barbershop_settings', JSON.stringify(data))
        window.__APP_SETTINGS__ = data
        alert('Pengaturan tersimpan (mode offline)')
      } catch (err) {
        alert('Gagal menyimpan: ' + err.message)
      }
    } finally { setSaving(false) }
  }

  async function syncFx(){
    setSyncingFx(true)
    try{
      const base = import.meta.env.VITE_API_BASE || 'http://localhost/api/v1'
      const res = await fetch(`${base}/settings/fx-sync`, {
        method:'POST',
        headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify({ target: data.fx?.target || 'USD' })
      })
      const out = await res.json().catch(()=>({}))
      if(!res.ok){ throw new Error(out.message || 'Gagal sync kurs') }
      const fx = out.fx || {}
      setData(prev => ({ ...prev, fx: { ...(prev.fx||{}), ...fx } }))
      try { window.dispatchEvent(new CustomEvent('app:settings-updated', { detail: { fx } })) } catch {}
      alert(`Kurs diperbarui: 1 ${data.currency||'IDR'} = ${fx.rate} ${fx.target} (source: ${fx.source||'-'})`)
    }catch(e){ alert(e.message) } finally { setSyncingFx(false) }
  }
  useEffect(()=>{ load() },[])

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-slate-600 via-gray-600 to-zinc-600 px-8 py-12 text-white">
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-white/10 p-3">
                <Store className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">✂️ Pengaturan Barbershop</h1>
                <p className="text-slate-100">Konfigurasi layanan cukur rambut & pengaturan bisnis</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="secondary" size="lg" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
              <Link to="/" className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Dashboard
              </Link>
            </Button>
          </div>
        </div>
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10"></div>
        <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-white/5"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Store Information */}
        <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scissors className="h-5 w-5 text-slate-600" />
              Informasi Barbershop
            </CardTitle>
            <CardDescription>
              Data dasar dan identitas barbershop Anda
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading && !cached && (
              <div className="p-3 text-sm text-gray-500">Memuat pengaturan barbershop...</div>
            )}
            <div>
              <Label htmlFor="storeName">Nama Barbershop</Label>
              <Input
                id="storeName"
                placeholder="Contoh: Barbershop Professional"
                value={data.store?.name||''}
                onChange={e=>setData({...data, store:{...data.store, name:e.target.value}})}
                className="h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-slate-500 transition-all"
              />
            </div>
            <div>
              <Label htmlFor="specialty">Spesialisasi</Label>
              <Input
                id="specialty"
                placeholder="Contoh: Cukur Rambut Pria & Styling Modern"
                value={data.store?.specialty||''}
                onChange={e=>setData({...data, store:{...data.store, specialty:e.target.value}})}
                className="h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-slate-500 transition-all"
              />
            </div>
            <div>
              <Label htmlFor="businessHours">Jam Operasional</Label>
              <Input
                id="businessHours"
                placeholder="Contoh: 08:00 - 22:00"
                value={data.store?.business_hours||''}
                onChange={e=>setData({...data, store:{...data.store, business_hours:e.target.value}})}
                className="h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-slate-500 transition-all"
              />
            </div>
            <div>
              <Label htmlFor="storeAddress">Alamat</Label>
              <Textarea
                id="storeAddress"
                placeholder="Alamat lengkap toko"
                value={data.store?.address||''}
                onChange={e=>setData({...data, store:{...data.store, address:e.target.value}})}
                className="min-h-[80px] border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-slate-500 transition-all resize-none"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="storePhone">Telepon</Label>
                <Input
                  id="storePhone"
                  placeholder="(021) 123-4567"
                  value={data.store?.phone||''}
                  onChange={e=>setData({...data, store:{...data.store, phone:e.target.value}})}
                  className="h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-slate-500 transition-all"
                />
              </div>
              <div>
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  placeholder="08123456789"
                  value={data.store?.whatsapp||''}
                  onChange={e=>setData({...data, store:{...data.store, whatsapp:e.target.value}})}
                  className="h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-slate-500 transition-all"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="storeEmail">Email</Label>
                <Input
                  id="storeEmail"
                  type="email"
                  placeholder="info@barbershop.com"
                  value={data.store?.email||''}
                  onChange={e=>setData({...data, store:{...data.store, email:e.target.value}})}
                  className="h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-slate-500 transition-all"
                />
              </div>
              <div>
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  placeholder="@barbershop_keren"
                  value={data.store?.instagram||''}
                  onChange={e=>setData({...data, store:{...data.store, instagram:e.target.value}})}
                  className="h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-slate-500 transition-all"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="storeNpwp">NPWP</Label>
                <Input
                  id="storeNpwp"
                  placeholder="NPWP (opsional)"
                  value={data.store?.npwp||''}
                  onChange={e=>setData({...data, store:{...data.store, npwp:e.target.value}})}
                  className="h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-slate-500 transition-all"
                />
              </div>
              <div>
                <Label htmlFor="storeNib">NIB/Perizinan</Label>
                <Input
                  id="storeNib"
                  placeholder="Nomor Induk Berusaha (opsional)"
                  value={data.store?.nib||''}
                  onChange={e=>setData({...data, store:{...data.store, nib:e.target.value}})}
                  className="h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-slate-500 transition-all"
                />
              </div>
              <div>
                <Label htmlFor="logoUrl">Logo URL</Label>
                <Input
                  id="logoUrl"
                  placeholder="https://.../logo.png"
                  value={data.store?.logo_url||''}
                  onChange={e=>setData({...data, store:{...data.store, logo_url:e.target.value}})}
                  className="h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-slate-500 transition-all"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="currency">Mata Uang</Label>
              <Input
                id="currency"
                placeholder="IDR"
                value={data.currency||'IDR'}
                onChange={e=>setData({...data, currency:e.target.value})}
                className="h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-slate-500 transition-all"
              />
            </div>
          </CardContent>
        </Card>

        {/* Barbershop Features */}
        <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-slate-600" />
              Fitur Barbershop
            </CardTitle>
            <CardDescription>
              Pengaturan layanan dan fitur khusus barbershop
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="appointmentDuration">Durasi Standar Appointment (menit)</Label>
                <Input
                  id="appointmentDuration"
                  type="number"
                  min="15"
                  max="240"
                  step="15"
                  placeholder="60"
                  value={data.barbershop?.appointment_duration||60}
                  onChange={e=>setData({...data, barbershop:{...data.barbershop, appointment_duration:Number(e.target.value||60)}})}
                  className="h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-slate-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`rounded-full p-2 ${
                    data.barbershop?.booking_enabled ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    {data.barbershop?.booking_enabled ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <Label htmlFor="bookingEnabled" className="font-semibold">Sistem Booking</Label>
                    <p className="text-sm text-gray-500">
                      {data.barbershop?.booking_enabled ? 'Pelanggan dapat membuat appointment' : 'Booking tidak tersedia'}
                    </p>
                  </div>
                </div>
                <Switch
                  id="bookingEnabled"
                  checked={!!data.barbershop?.booking_enabled}
                  onCheckedChange={checked=>setData({...data, barbershop:{...data.barbershop, booking_enabled:checked}})}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`rounded-full p-2 ${
                    data.barbershop?.walk_in_enabled ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    {data.barbershop?.walk_in_enabled ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <Label htmlFor="walkInEnabled" className="font-semibold">Walk-In Service</Label>
                    <p className="text-sm text-gray-500">
                      {data.barbershop?.walk_in_enabled ? 'Melayani pelanggan tanpa appointment' : 'Hanya melayani appointment'}
                    </p>
                  </div>
                </div>
                <Switch
                  id="walkInEnabled"
                  checked={!!data.barbershop?.walk_in_enabled}
                  onCheckedChange={checked=>setData({...data, barbershop:{...data.barbershop, walk_in_enabled:checked}})}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`rounded-full p-2 ${
                    data.barbershop?.rating_enabled ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    {data.barbershop?.rating_enabled ? (
                      <Star className="h-5 w-5 text-green-600" />
                    ) : (
                      <Star className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <Label htmlFor="ratingEnabled" className="font-semibold">Rating & Review</Label>
                    <p className="text-sm text-gray-500">
                      {data.barbershop?.rating_enabled ? 'Pelanggan dapat memberikan rating' : 'Rating tidak tersedia'}
                    </p>
                  </div>
                </div>
                <Switch
                  id="ratingEnabled"
                  checked={!!data.barbershop?.rating_enabled}
                  onCheckedChange={checked=>setData({...data, barbershop:{...data.barbershop, rating_enabled:checked}})}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`rounded-full p-2 ${
                    data.barbershop?.photo_enabled ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    {data.barbershop?.photo_enabled ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <Label htmlFor="photoEnabled" className="font-semibold">Before/After Photos</Label>
                    <p className="text-sm text-gray-500">
                      {data.barbershop?.photo_enabled ? 'Dokumentasi foto sebelum & sesudah' : 'Foto tidak diaktifkan'}
                    </p>
                  </div>
                </div>
                <Switch
                  id="photoEnabled"
                  checked={!!data.barbershop?.photo_enabled}
                  onCheckedChange={checked=>setData({...data, barbershop:{...data.barbershop, photo_enabled:checked}})}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tax Settings */}
        <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-slate-600" />
              Pengaturan Pajak (Opsional)
            </CardTitle>
            <CardDescription>
              Konfigurasi PPN untuk bisnis terdaftar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`rounded-full p-2 ${
                  data.tax?.enabled ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  {data.tax?.enabled ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div>
                  <Label htmlFor="taxEnabled" className="font-semibold">PPN Aktif</Label>
                  <p className="text-sm text-gray-500">
                    {data.tax?.enabled ? 'PPN akan diterapkan pada transaksi' : 'PPN tidak diterapkan'}
                  </p>
                </div>
              </div>
              <Switch
                id="taxEnabled"
                checked={!!data.tax?.enabled}
                onCheckedChange={checked=>setData({...data, tax:{...data.tax, enabled:checked}})}
              />
            </div>
            {data.tax?.enabled && (
              <div>
                <Label htmlFor="taxRate">Tarif PPN (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  placeholder="11"
                  min="0"
                  max="100"
                  step="0.1"
                  value={data.tax?.rate||0}
                  onChange={e=>setData({...data, tax:{...data.tax, rate:Number(e.target.value||0)}})}
                  className="h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-slate-500 transition-all"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pricing & Currency Settings */}
      <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-slate-600" />
            Pengaturan Mata Uang & Pembulatan
          </CardTitle>
          <CardDescription>
            Format tampilan dan kebijakan pembulatan transaksi
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="currency2">Mata Uang</Label>
              <Input
                id="currency2"
                placeholder="IDR"
                value={data.currency||'IDR'}
                onChange={e=>setData({...data, currency:e.target.value})}
                className="h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-slate-500 transition-all"
              />
            </div>
            <div>
              <Label htmlFor="rounding">Pembulatan</Label>
              <select
                id="rounding"
                value={data.pricing?.rounding||'none'}
                onChange={e=>setData({...data, pricing:{...data.pricing, rounding:e.target.value}})}
                className="w-full h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-slate-500 rounded-md px-3"
              >
                <option value="none">Tidak ada</option>
                <option value="nearest_100">Ke ratusan terdekat</option>
                <option value="nearest_1000">Ke ribuan terdekat</option>
              </select>
              <div className="mt-3">
                <Label htmlFor="rounding_mode">Metode Pembulatan</Label>
                <select
                  id="rounding_mode"
                  value={data.pricing?.rounding_mode||'normal'}
                  onChange={e=>setData({...data, pricing:{...data.pricing, rounding_mode:e.target.value}})}
                  className="w-full h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-slate-500 rounded-md px-3"
                >
                  <option value="normal">Normal (naik/turun ke terdekat)</option>
                  <option value="discount">Pembulatan Diskon (selalu turun)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Pembulatan Diskon tidak pernah menambah harga; selisih dianggap diskon.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Switch id="fxEnabled" checked={!!data.fx?.enabled} onCheckedChange={(v)=>setData({...data, fx:{...data.fx, enabled:v}})} />
              <Label htmlFor="fxEnabled">Tampilkan Konversi</Label>
            </div>
            <div>
              <Label htmlFor="fxTarget">Mata Uang Target</Label>
              <Input id="fxTarget" placeholder="USD" value={data.fx?.target||'USD'} onChange={e=>setData({...data, fx:{...data.fx, target:e.target.value}})} className="h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-slate-500" />
            </div>
            <div>
              <Label htmlFor="fxRate">Kurs</Label>
              <Input id="fxRate" type="number" step="0.0001" placeholder="Masukkan kurs" value={data.fx?.rate||''} onChange={e=>setData({...data, fx:{...data.fx, rate:e.target.value}})} className="h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-slate-500" />
            </div>
            <div className="sm:col-span-3 flex items-center gap-2">
              <Button type="button" onClick={syncFx} disabled={syncingFx} className="bg-slate-600 hover:bg-slate-700">
                {syncingFx ? 'Syncing Kurs...' : 'Sync Kurs Otomatis'}
              </Button>
              <p className="text-sm text-gray-500">Mengambil kurs terbaru dari internet dan menyimpannya ke pengaturan.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Branding */}
      <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5 text-slate-600" />
            Branding
          </CardTitle>
          <CardDescription>
            Warna utama dan identitas visual
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="primaryColor">Warna Utama</Label>
            <Input id="primaryColor" type="color" value={data.branding?.primary_color||'#475569'} onChange={e=>setData({...data, branding:{...data.branding, primary_color:e.target.value}})} className="h-10 w-20 p-1" />
          </div>
        </CardContent>
      </Card>

      {/* Receipt Settings */}
      <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-slate-600" />
            Pengaturan Struk
          </CardTitle>
          <CardDescription>
            Kustomisasi tampilan dan konten struk pembayaran
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="receiptFooter">Footer Struk</Label>
            <Textarea
              id="receiptFooter"
              placeholder="Terima kasih atas kunjungan Anda!\nSimpan struk ini sebagai bukti pembelian"
              value={data.receipt?.footer||''}
              onChange={e=>setData({...data, receipt:{...data.receipt, footer:e.target.value}})}
              className="min-h-[120px] border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-slate-500 transition-all resize-none"
              rows={4}
            />
            <p className="text-sm text-gray-500 mt-2">
              Teks yang akan ditampilkan di bagian bawah struk. Gunakan \n untuk baris baru.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Card className="shadow-lg border-0 bg-gradient-to-r from-slate-50 to-gray-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Simpan Pengaturan</h3>
              <p className="text-gray-600">Pastikan semua pengaturan sudah benar sebelum menyimpan</p>
            </div>
            <Button
              onClick={save}
              disabled={saving}
              size="lg"
              className="bg-gradient-to-r from-slate-600 to-gray-600 hover:from-slate-700 hover:to-gray-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all min-w-[140px]"
            >
              {saving ? (
                <>
                  <Settings className="h-4 w-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Simpan
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
