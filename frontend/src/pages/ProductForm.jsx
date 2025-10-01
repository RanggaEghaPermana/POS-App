import { useEffect, useState } from 'react'
import { useAuth } from '../AuthContext'
import { apiGet } from '../api'
import { formatMoney } from '../utils/currency'
import useCurrency from '../hooks/useCurrency'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Checkbox } from '../components/ui/checkbox'
import { RupiahInput } from '../components/ui/rupiah-input'
import { formatRupiah } from '../utils/formatters'
import {
  ArrowLeft, Save, Package, Hash, FolderOpen, Banknote,
  Hash as HashIcon, ImageIcon, ToggleLeft, ToggleRight, Loader2,
  Upload, X, Eye, CheckCircle, AlertCircle, Camera, Building2,
  Calendar, Truck, Tag
} from 'lucide-react'

export default function ProductForm(){
  const { token, logout, activeTenant } = useAuth()
  const { id } = useParams()
  const editing = !!id
  const nav = useNavigate()
  const [cats, setCats] = useState([])
  const [businessType, setBusinessType] = useState(null)

  const [dynamicFields, setDynamicFields] = useState({})
  const [form, setForm] = useState({
    name:'', sku:'', category_id:'', price:'', stock:'', active:true, image:null,
    // Extended fields
    brand:'', cost_price:'', margin_percentage:'', supplier:'', unit_type:'pcs',
    weight:'', dimensions:'', expired_date:'', minimum_stock:'', location:'',
    tax_rate:'', discount_percentage:'', notes:'',
    // Dynamic fields akan diisi berdasarkan business type
    dynamic_fields: {}
  })
  const [loading, setLoading] = useState(false)
  const currency = useCurrency('IDR')

  // Load categories separately to avoid interference
  useEffect(()=>{ (async()=>{
    if (!token || !activeTenant) return

    try {
      // Try to load categories from API
      let c
      try {
        c = await apiGet('/categories', token)
      } catch {
        c = await apiGet('/setup/categories', token)
      }
      setCats(c.data || c || [])
      console.log("ProductForm: Categories loaded:", c.data?.length || c?.length || 0)
    } catch (error) {
      console.error('Failed to load categories:', error.message)
      if (error.message === 'Unauthenticated.') {
        console.log('Token expired, redirecting to login...')
        logout()
        return
      }
      // If API fails, check if we have demo categories in localStorage based on business type
      const businessType = activeTenant?.business_type || 'general'
      const storagePrefix = businessType === 'restaurant' ? 'restaurant' : 'barbershop'
      const storedCategories = localStorage.getItem(`${storagePrefix}_categories_data`)

      if (storedCategories) {
        try {
          const categories = JSON.parse(storedCategories)
          setCats(categories || [])
          console.log("ProductForm: Categories loaded from localStorage:", categories?.length || 0)
        } catch (e) {
          console.error('Failed to parse stored categories:', e)
          setCats([])
        }
      } else {
        setCats([])
        console.log("ProductForm: No categories available - user needs to create them in Categories page")
      }
    }
  })() }, [token, activeTenant?.id])

  // Load business type and dynamic fields separately
  useEffect(()=>{ (async()=>{
    if (!token || !activeTenant) return

    try {
      let bt
      try {
        bt = await apiGet('/config', token)
      } catch {
        bt = await apiGet('/setup/config', token)
      }
      const businessTypeSlug = bt.business_type || 'general'

      // Set simplified business type info and default fields based on slug
      if (businessTypeSlug === 'barbershop') {
        setBusinessType({ name: 'Barbershop', slug: 'barbershop' })
        setDynamicFields({
          hair_type: { label: 'Jenis Rambut', type: 'select', options: ['Keriting', 'Lurus', 'Bergelombang', 'Tebal', 'Tipis'], required: false },
          treatment_duration: { label: 'Durasi Treatment (menit)', type: 'number', required: false },
          suitable_for_gender: { label: 'Cocok Untuk', type: 'select', options: ['Pria', 'Wanita', 'Unisex'], required: false },
          hair_product_type: { label: 'Tipe Produk Rambut', type: 'select', options: ['Shampoo', 'Conditioner', 'Hair Tonic', 'Pomade', 'Wax', 'Gel', 'Hair Spray', 'Hair Oil'], required: false },
          ingredients: { label: 'Bahan Utama', type: 'text', required: false }
        })
      } else if (businessTypeSlug === 'laundry') {
        setBusinessType({ name: 'Laundry', slug: 'laundry' })
        setDynamicFields({
          fabric_type: { label: 'Jenis Kain', type: 'select', options: ['Katun', 'Polyester', 'Silk', 'Wool', 'Denim', 'Linen'], required: false },
          wash_temperature: { label: 'Suhu Cuci (°C)', type: 'number', required: false },
          chemical_type: { label: 'Jenis Chemical', type: 'select', options: ['Detergent', 'Softener', 'Bleach', 'Stain Remover'], required: false },
          usage_per_kg: { label: 'Pemakaian per KG', type: 'text', required: false }
        })
      } else if (businessTypeSlug === 'photocopy') {
        setBusinessType({ name: 'Fotokopi & Percetakan', slug: 'photocopy' })
        setDynamicFields({
          paper_size: { label: 'Ukuran Kertas', type: 'select', options: ['A4', 'A3', 'F4', 'Letter', 'Legal', 'A5'], required: false },
          paper_type: { label: 'Jenis Kertas', type: 'select', options: ['HVS 70gsm', 'HVS 80gsm', 'Art Paper', 'Photo Paper', 'Karton'], required: false },
          color_type: { label: 'Jenis Warna', type: 'select', options: ['Hitam Putih', 'Berwarna', 'Hitam Putih & Berwarna'], required: false },
          finish_type: { label: 'Jenis Finishing', type: 'select', options: ['Tanpa Finishing', 'Laminating', 'Jilid', 'Staples'], required: false }
        })
      } else if (businessTypeSlug === 'restaurant') {
        setBusinessType({ name: 'Restaurant', slug: 'restaurant' })
        setDynamicFields({
          food_category: { label: 'Kategori Makanan', type: 'select', options: ['Makanan Utama', 'Appetizer', 'Dessert', 'Minuman', 'Bahan Baku'], required: false },
          spice_level: { label: 'Level Pedas', type: 'select', options: ['Tidak Pedas', 'Sedikit Pedas', 'Pedas', 'Sangat Pedas'], required: false },
          cooking_time: { label: 'Waktu Masak (menit)', type: 'number', required: false },
          allergens: { label: 'Alergen', type: 'text', required: false },
          halal_status: { label: 'Status Halal', type: 'select', options: ['Halal', 'Non-Halal', 'Belum Sertifikat'], required: false }
        })
      } else if (businessTypeSlug === 'pharmacy') {
        setBusinessType({ name: 'Apotek', slug: 'pharmacy' })
        setDynamicFields({
          medicine_type: { label: 'Jenis Obat', type: 'select', options: ['Obat Bebas', 'Obat Bebas Terbatas', 'Obat Keras', 'Obat Tradisional'], required: false },
          dosage_form: { label: 'Bentuk Sediaan', type: 'select', options: ['Tablet', 'Kapsul', 'Sirup', 'Salep', 'Tetes', 'Injeksi'], required: false },
          prescription_required: { label: 'Perlu Resep', type: 'boolean', required: false },
          storage_condition: { label: 'Kondisi Penyimpanan', type: 'select', options: ['Suhu Ruang', 'Kulkas 2-8°C', 'Freezer', 'Hindari Cahaya'], required: false },
          active_ingredient: { label: 'Zat Aktif', type: 'text', required: false }
        })
      } else if (businessTypeSlug === 'automotive') {
        setBusinessType({ name: 'Otomotif', slug: 'automotive' })
        setDynamicFields({
          vehicle_type: { label: 'Jenis Kendaraan', type: 'select', options: ['Motor', 'Mobil', 'Truk', 'Universal'], required: false },
          part_category: { label: 'Kategori Spare Part', type: 'select', options: ['Mesin', 'Body', 'Electrical', 'Oli & Pelumas', 'Ban', 'Aksesoris'], required: false },
          vehicle_brand: { label: 'Merk Kendaraan', type: 'select', options: ['Honda', 'Toyota', 'Suzuki', 'Yamaha', 'Daihatsu', 'Mitsubishi', 'Universal'], required: false },
          compatibility: { label: 'Kompatibilitas', type: 'text', required: false }
        })
      } else if (businessTypeSlug === 'retail') {
        setBusinessType({ name: 'Retail', slug: 'retail' })
        setDynamicFields({
          product_category: { label: 'Kategori Produk', type: 'select', options: ['Elektronik', 'Fashion', 'Makanan & Minuman', 'Rumah Tangga', 'Olahraga', 'Buku & Alat Tulis'], required: false },
          target_age: { label: 'Target Usia', type: 'select', options: ['Anak-anak', 'Remaja', 'Dewasa', 'Lansia', 'Semua Usia'], required: false },
          season: { label: 'Musiman', type: 'select', options: ['Sepanjang Tahun', 'Musim Hujan', 'Musim Kemarau', 'Hari Raya'], required: false }
        })
      } else if (businessTypeSlug === 'clinic') {
        setBusinessType({ name: 'Klinik', slug: 'clinic' })
        setDynamicFields({
          medical_category: { label: 'Kategori Medis', type: 'select', options: ['Obat-obatan', 'Alat Medis', 'Konsumables', 'Vitamin & Suplemen'], required: false },
          sterilization_required: { label: 'Perlu Sterilisasi', type: 'boolean', required: false },
          disposal_method: { label: 'Cara Pembuangan', type: 'select', options: ['Biasa', 'Medical Waste', 'Khusus'], required: false }
        })
      } else {
        setBusinessType({ name: 'General', slug: 'general' })
        setDynamicFields({})
      }

    } catch (e) {
      console.error('Failed to load data:', e)
      console.error('Error details:', e.message)
      if (e.response) {
        console.error('Response status:', e.response.status)
        console.error('Response data:', e.response.data)
      }
      // Don't interfere with categories loading
      console.error('Failed to load business config:', e.message)
      if (e.message === 'Unauthenticated.') {
        console.log('Token expired during config load, redirecting to login...')
        logout()
        return
      }
    }
  })() }, [token])

  // Load product data when editing
  useEffect(()=>{
    if (!editing || !id || !token) return

    (async()=>{
      try {
        let p
        try {
          p = await apiGet(`/admin/products/${id}`, token)
        } catch {
          p = await apiGet(`/setup/admin/products/${id}`, token)
        }
        setForm({
          name: p.name || '',
          sku: p.sku || '',
          category_id: p.category_id || '',
          price: p.price || 0,
          stock: p.stock || 0,
          active: !!p.active,
          image: null,
          brand: p.brand || '',
          cost_price: p.cost_price || '',
          margin_percentage: p.margin_percentage || '',
          supplier: p.supplier || '',
          unit_type: p.unit_type || 'pcs',
          weight: p.weight || '',
          dimensions: p.dimensions || '',
          expired_date: p.expired_date || '',
          minimum_stock: p.minimum_stock || '',
          location: p.location || '',
          tax_rate: p.tax_rate || '',
          discount_percentage: p.discount_percentage || '',
          notes: p.notes || '',
          dynamic_fields: p.dynamic_fields || {}
        })
      } catch (e) {
        console.error('Failed to load product:', e)
        alert('Failed to load product: ' + e.message)
      }
    })()
  }, [editing, id, token])

  async function submit(e){
    e.preventDefault()
    setLoading(true)


    try{
      const fd = new FormData()

      // Basic fields
      fd.append('name', form.name)
      fd.append('sku', form.sku)
      if(form.category_id) fd.append('category_id', form.category_id)
      fd.append('price', form.price)
      fd.append('stock', form.stock)
      fd.append('active', form.active ? '1' : '0')
      if(form.image) fd.append('image', form.image)

      // Extended fields
      if(form.brand) fd.append('brand', form.brand)
      if(form.cost_price) fd.append('cost_price', form.cost_price)
      if(form.margin_percentage) fd.append('margin_percentage', form.margin_percentage)
      if(form.supplier) fd.append('supplier', form.supplier)
      fd.append('unit_type', form.unit_type)
      if(form.weight) fd.append('weight', form.weight)
      if(form.dimensions) fd.append('dimensions', form.dimensions)
      if(form.expired_date) fd.append('expired_date', form.expired_date)
      if(form.minimum_stock) fd.append('minimum_stock', form.minimum_stock)
      if(form.location) fd.append('location', form.location)
      if(form.tax_rate) fd.append('tax_rate', form.tax_rate)
      if(form.discount_percentage) fd.append('discount_percentage', form.discount_percentage)
      if(form.notes) fd.append('notes', form.notes)

      // Dynamic fields
      fd.append('dynamic_fields', JSON.stringify(form.dynamic_fields))

      const method = editing ? 'PUT' : 'POST'
      const url = editing ? `/admin/products/${id}` : '/admin/products'
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000/api/v1'

      // Get tenant headers manually since we're not using apiPost
      const tenantHeaders = {}
      if (activeTenant?.slug) tenantHeaders['X-Tenant-Slug'] = activeTenant.slug
      if (activeTenant?.id) tenantHeaders['X-Tenant-Id'] = activeTenant.id

      let res
      try {
        res = await fetch(API_BASE + url, {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
            ...tenantHeaders
          },
          body: fd
        })

        // Check if response is not ok, try fallback
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
      } catch (error) {
        console.log('Main endpoint failed, trying setup endpoint:', error.message)
        // Fallback to setup endpoint
        const setupUrl = editing ? `/setup/admin/products/${id}` : '/setup/admin/products'
        res = await fetch(API_BASE + setupUrl, {
          method,
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: fd
        })
      }

      const data = await res.json().catch(() => ({}))
      if(!res.ok) throw new Error(data.message || data.error || `HTTP ${res.status}: Gagal simpan produk`)
      nav('/inventory')
    }catch(e){ alert(e.message) } finally{ setLoading(false) }
  }

  function updateDynamicField(fieldName, value) {
    setForm(prev => ({
      ...prev,
      dynamic_fields: {
        ...prev.dynamic_fields,
        [fieldName]: value
      }
    }))
  }

  function renderDynamicField(fieldName, fieldConfig) {
    const value = form.dynamic_fields[fieldName] || ''

    switch(fieldConfig.type) {
      case 'text':
        return (
          <Input
            value={value}
            onChange={e=>updateDynamicField(fieldName, e.target.value)}
            placeholder={`Masukkan ${fieldConfig.label.toLowerCase()}`}
            className="h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-gray-500"
          />
        )
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={e=>updateDynamicField(fieldName, e.target.value)}
            placeholder="0"
            className="h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-gray-500"
          />
        )
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={e=>updateDynamicField(fieldName, e.target.value)}
            placeholder={`Masukkan ${fieldConfig.label.toLowerCase()}`}
            className="w-full h-20 px-3 py-2 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-gray-500 rounded-md"
            rows={3}
          />
        )
      case 'select':
        return (
          <Select
            value={value === '' ? '__empty__' : value}
            onValueChange={(val) => updateDynamicField(fieldName, val === '__empty__' ? '' : val)}
          >
            <SelectTrigger className="h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-gray-500">
              <SelectValue placeholder={`Pilih ${fieldConfig.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__empty__">-- Pilih --</SelectItem>
              {fieldConfig.options?.map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={e=>updateDynamicField(fieldName, e.target.value)}
            className="h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-gray-500"
          />
        )
      case 'boolean':
        return (
          <Checkbox
            checked={value === true || value === 'true'}
            onCheckedChange={(checked) => updateDynamicField(fieldName, checked)}
            className="h-5 w-5"
          />
        )
      default:
        return (
          <Input
            value={value}
            onChange={e=>updateDynamicField(fieldName, e.target.value)}
            className="h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-gray-500"
          />
        )
    }
  }

  // Helper functions for dynamic labels and placeholders
  function getNameLabel(businessSlug) {
    switch(businessSlug) {
      case 'barbershop': return 'Nama Produk/Treatment *'
      case 'restaurant': return 'Nama Menu/Bahan *'
      case 'pharmacy': return 'Nama Obat/Produk Kesehatan *'
      case 'automotive': return 'Nama Spare Part/Produk *'
      case 'photocopy': return 'Nama Layanan/Produk *'
      case 'clinic': return 'Nama Produk Medis *'
      case 'retail': return 'Nama Produk Retail *'
      case 'laundry': return 'Nama Produk Laundry *'
      default: return 'Nama Produk *'
    }
  }

  function getNamePlaceholder(businessSlug) {
    switch(businessSlug) {
      case 'barbershop': return 'Contoh: Pomade Premium, Hair Treatment'
      case 'restaurant': return 'Contoh: Nasi Gudeg, Ayam Bakar, Bahan Bumbu'
      case 'pharmacy': return 'Contoh: Paracetamol 500mg, Vitamin C'
      case 'automotive': return 'Contoh: Filter Oli Honda, Ban Michelin'
      case 'photocopy': return 'Contoh: Fotokopi A4, Jilid Spiral'
      case 'clinic': return 'Contoh: Sarung Tangan Latex, Stetoskop'
      case 'retail': return 'Contoh: Baju Kaos, Sepatu Sneakers'
      case 'laundry': return 'Contoh: Detergen Cair, Pewangi Pakaian'
      default: return 'Contoh: Produk Umum'
    }
  }

  function getSKUPlaceholder(businessSlug) {
    switch(businessSlug) {
      case 'barbershop': return 'Contoh: POMADE-001, TREAT-001'
      case 'restaurant': return 'Contoh: MENU-001, BAHAN-001'
      case 'pharmacy': return 'Contoh: OBAT-001, VIT-001'
      case 'automotive': return 'Contoh: SPARE-001, OLI-001'
      case 'photocopy': return 'Contoh: COPY-001, PRINT-001'
      case 'clinic': return 'Contoh: MED-001, TOOL-001'
      case 'retail': return 'Contoh: RTL-001, FASH-001'
      case 'laundry': return 'Contoh: DET-001, CHEM-001'
      default: return 'Contoh: PROD-001'
    }
  }

  return (
    <div className="space-y-8">
      {/* Header Section - Compact & Professional */}
      <div className="flex items-center justify-between bg-white border-b border-gray-200 px-6 py-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {editing
              ? (businessType?.slug === 'barbershop' ? 'Edit Produk Grooming' : 'Edit Produk')
              : (businessType?.slug === 'barbershop' ? 'Tambah Produk Grooming' : 'Tambah Produk Baru')
            }
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {editing
              ? (businessType?.slug === 'barbershop' ? 'Perbarui informasi produk grooming' : 'Perbarui informasi produk')
              : (businessType?.slug === 'barbershop' ? 'Tambahkan produk grooming baru seperti pomade, shampoo, atau styling product' : 'Tambahkan produk baru ke inventori')
            }
          </p>
          {businessType && (
            <div className="flex items-center gap-2 mt-2">
              <Building2 className="h-4 w-4 text-gray-400" />
              <span className="text-gray-500 text-xs">Bisnis: {businessType.name}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
            <Link to="/inventory" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              {businessType?.slug === 'barbershop' ? 'Kembali ke Produk Grooming' : 'Kembali ke Inventori'}
            </Link>
          </Button>
        </div>
      </div>

      {/* Form Container */}
      <div className="max-w-4xl mx-auto">
        <form onSubmit={submit} className="space-y-8">
          {/* Basic Information Card */}
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                <span>{businessType?.slug === 'barbershop' ? 'Informasi Produk Grooming' : 'Informasi Dasar'}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                    {getNameLabel(businessType?.slug)}
                  </Label>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500" />
                    <Input
                      id="name"
                      value={form.name}
                      onChange={e=>setForm({...form, name:e.target.value})}
                      placeholder={getNamePlaceholder(businessType?.slug || 'barbershop')}
                      className="pl-10 h-12 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-gray-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sku" className="text-sm font-semibold text-gray-700">
                    {businessType?.slug === 'barbershop' ? 'Kode Produk Grooming *' : 'SKU (Stock Keeping Unit) *'}
                  </Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <Input
                      id="sku"
                      value={form.sku}
                      onChange={e=>setForm({...form, sku:e.target.value.toUpperCase()})}
                      placeholder={getSKUPlaceholder(businessType?.slug || 'barbershop')}
                      className="pl-10 h-12 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-gray-500 transition-all"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    {businessType?.slug === 'barbershop' ? 'Kategori Produk Grooming' : 'Kategori Produk'}
                  </Label>
                  <Select
                    value={form.category_id ? form.category_id.toString() : '__none__'}
                    onValueChange={(value) => setForm({...form, category_id: value === '__none__' ? '' : value})}
                  >
                    <SelectTrigger className="h-12 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-gray-500">
                      <SelectValue placeholder={businessType?.slug === 'barbershop' ? 'Pilih kategori produk grooming' : 'Pilih kategori produk'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                          Tanpa Kategori
                        </div>
                      </SelectItem>
                      {cats.length === 0 ? (
                        <SelectItem value="__loading__" disabled>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse"></div>
                            {activeTenant ? 'Memuat kategori...' : 'Pilih tenant terlebih dahulu'}
                          </div>
                        </SelectItem>
                      ) : (
                        cats.map(c => (
                          <SelectItem key={c.id} value={c.id.toString()}>
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-gray-500"></div>
                              {c.name}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit_type" className="text-sm font-semibold text-gray-700">
                    {businessType?.slug === 'barbershop' ? 'Satuan Produk Grooming' : 'Satuan Unit'}
                  </Label>
                  <Select
                    value={form.unit_type}
                    onValueChange={(value) => setForm({...form, unit_type: value})}
                  >
                    <SelectTrigger className="h-12 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-gray-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pcs">Pieces (pcs)</SelectItem>

                      {/* Barbershop specific units */}
                      {businessType?.slug === 'barbershop' && (
                        <>
                          <SelectItem value="ml">Milliliter (ml)</SelectItem>
                          <SelectItem value="treatment">Per Treatment</SelectItem>
                          <SelectItem value="session">Per Session</SelectItem>
                          <SelectItem value="tube">Tube</SelectItem>
                          <SelectItem value="bottle">Bottle</SelectItem>
                        </>
                      )}

                      {/* Restaurant specific units */}
                      {businessType?.slug === 'restaurant' && (
                        <>
                          <SelectItem value="portion">Per Porsi</SelectItem>
                          <SelectItem value="serving">Per Sajian</SelectItem>
                          <SelectItem value="recipe">Per Resep</SelectItem>
                        </>
                      )}

                      {/* Pharmacy specific units */}
                      {businessType?.slug === 'pharmacy' && (
                        <>
                          <SelectItem value="tablet">Tablet</SelectItem>
                          <SelectItem value="capsule">Kapsul</SelectItem>
                          <SelectItem value="bottle">Botol</SelectItem>
                          <SelectItem value="strip">Strip</SelectItem>
                          <SelectItem value="vial">Vial</SelectItem>
                        </>
                      )}

                      {/* Automotive specific units */}
                      {businessType?.slug === 'automotive' && (
                        <>
                          <SelectItem value="set">Set</SelectItem>
                          <SelectItem value="unit">Unit</SelectItem>
                          <SelectItem value="pair">Pasang</SelectItem>
                        </>
                      )}

                      {/* Photocopy specific units */}
                      {businessType?.slug === 'photocopy' && (
                        <>
                          <SelectItem value="sheet">Lembar</SelectItem>
                          <SelectItem value="copy">Copy</SelectItem>
                          <SelectItem value="page">Halaman</SelectItem>
                          <SelectItem value="rim">Rim</SelectItem>
                        </>
                      )}

                      {/* Clinic specific units */}
                      {businessType?.slug === 'clinic' && (
                        <>
                          <SelectItem value="piece">Piece</SelectItem>
                          <SelectItem value="sterile">Steril</SelectItem>
                          <SelectItem value="disposable">Disposable</SelectItem>
                        </>
                      )}

                      {/* Standard units */}
                      <SelectItem value="kg">Kilogram (kg)</SelectItem>
                      <SelectItem value="gram">Gram (g)</SelectItem>
                      <SelectItem value="liter">Liter (L)</SelectItem>
                      <SelectItem value="meter">Meter (m)</SelectItem>
                      <SelectItem value="box">Box</SelectItem>
                      <SelectItem value="pack">Pack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Inventory Card */}
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Banknote className="h-5 w-5 text-green-600" />
                <span>Harga & Inventori</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="cost_price" className="text-sm font-semibold text-gray-700">
                    Harga Modal (Rupiah)
                  </Label>
                  <RupiahInput
                    id="cost_price"
                    value={form.cost_price}
                    onChange={value=>setForm({...form, cost_price:value.toString()})}
                    placeholder={businessType?.slug === 'barbershop' ? 'Contoh: 45000 (untuk pomade), 25000 (untuk shampoo)' : businessType?.slug ? 'Masukkan harga modal...' : 'Contoh: 45000 (untuk pomade), 25000 (untuk shampoo)'}
                    className="h-12 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-gray-500 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price" className="text-sm font-semibold text-gray-700">
                    Harga Jual (Rupiah) *
                  </Label>
                  <RupiahInput
                    id="price"
                    value={form.price}
                    onChange={value=>setForm({...form, price:value.toString()})}
                    placeholder={businessType?.slug === 'barbershop' ? 'Contoh: 75000 (untuk pomade), 45000 (untuk shampoo)' : businessType?.slug ? 'Masukkan harga jual...' : 'Contoh: 75000 (untuk pomade), 45000 (untuk shampoo)'}
                    className="h-12 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-gray-500 transition-all"
                    required
                  />
                  {form.price && (
                    <div className="text-xs text-gray-600">
                      {formatRupiah(form.price||0)}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="margin_percentage" className="text-sm font-semibold text-gray-700">
                    Margin (%)
                  </Label>
                  <Input
                    id="margin_percentage"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={form.margin_percentage}
                    onChange={e=>setForm({...form, margin_percentage:e.target.value})}
                    placeholder="0"
                    className="h-12 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-gray-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="stock" className="text-sm font-semibold text-gray-700">
                    Stok Saat Ini *
                  </Label>
                  <div className="relative">
                    <HashIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-500" />
                    <Input
                      id="stock"
                      type="number"
                      min="0"
                      value={form.stock}
                      onChange={e=>setForm({...form, stock:e.target.value})}
                      placeholder="0"
                      className="pl-10 h-12 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-gray-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minimum_stock" className="text-sm font-semibold text-gray-700">
                    Minimum Stok
                  </Label>
                  <Input
                    id="minimum_stock"
                    type="number"
                    min="0"
                    value={form.minimum_stock}
                    onChange={e=>setForm({...form, minimum_stock:e.target.value})}
                    placeholder="0"
                    className="h-12 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-gray-500 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm font-semibold text-gray-700">
                    Lokasi/Rak
                  </Label>
                  <Input
                    id="location"
                    value={form.location}
                    onChange={e=>setForm({...form, location:e.target.value})}
                    placeholder={businessType?.slug === 'barbershop' ? 'Contoh: Rak Display A-1, Lemari Produk B-2' : businessType?.slug ? 'Contoh: Rak A-1' : 'Contoh: Rak Display A-1, Lemari Produk B-2'}
                    className="h-12 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-gray-500 transition-all"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Extended Information Card */}
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-purple-600" />
                <span>Informasi Tambahan</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="brand" className="text-sm font-semibold text-gray-700">
                    {businessType?.slug === 'barbershop' ? 'Brand Produk Grooming' : 'Merk/Brand'}
                  </Label>
                  <Input
                    id="brand"
                    value={form.brand}
                    onChange={e=>setForm({...form, brand:e.target.value})}
                    placeholder={businessType?.slug === 'barbershop' ? 'Contoh: L\'Oreal, Wahl, Gatsby, Pomade.co' : businessType?.slug ? 'Contoh: Brand Produk' : 'Contoh: L\'Oreal, Wahl, Gatsby, Pomade.co'}
                    className="h-12 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-gray-500 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supplier" className="text-sm font-semibold text-gray-700">
                    {businessType?.slug === 'barbershop' ? 'Supplier/Distributor' : 'Supplier'}
                  </Label>
                  <div className="relative">
                    <Truck className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500" />
                    <Input
                      id="supplier"
                      value={form.supplier}
                      onChange={e=>setForm({...form, supplier:e.target.value})}
                      placeholder={businessType?.slug === 'barbershop' ? 'Contoh: PT Kosmetik Indonesia, Toko Peralatan Salon' : businessType?.slug ? 'Nama supplier' : 'Contoh: PT Kosmetik Indonesia, Toko Peralatan Salon'}
                      className="pl-10 h-12 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-gray-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="weight" className="text-sm font-semibold text-gray-700">
                    {businessType?.slug === 'barbershop' ? 'Berat Produk (gram)' : 'Berat (gram)'}
                  </Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.weight}
                    onChange={e=>setForm({...form, weight:e.target.value})}
                    placeholder={businessType?.slug === 'barbershop' ? 'Contoh: 150 (untuk pomade), 300 (untuk botol shampoo)' : businessType?.slug ? '0' : 'Contoh: 150 (untuk pomade), 300 (untuk botol shampoo)'}
                    className="h-12 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-gray-500 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dimensions" className="text-sm font-semibold text-gray-700">
                    {businessType?.slug === 'barbershop' ? 'Ukuran Kemasan (PxLxT cm)' : 'Dimensi (PxLxT cm)'}
                  </Label>
                  <Input
                    id="dimensions"
                    value={form.dimensions}
                    onChange={e=>setForm({...form, dimensions:e.target.value})}
                    placeholder={businessType?.slug === 'barbershop' ? 'Contoh: 15x8x5 (untuk pomade), 20x5x5 (untuk botol)' : businessType?.slug ? '10x5x2' : 'Contoh: 15x8x5 (untuk pomade), 20x5x5 (untuk botol)'}
                    className="h-12 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-gray-500 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expired_date" className="text-sm font-semibold text-gray-700">
                    {businessType?.slug === 'barbershop' ? 'Tanggal Expired Produk' : 'Tanggal Kedaluwarsa'}
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-red-500" />
                    <Input
                      id="expired_date"
                      type="date"
                      value={form.expired_date}
                      onChange={e=>setForm({...form, expired_date:e.target.value})}
                      className="pl-10 h-12 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-gray-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-semibold text-gray-700">
                  Catatan
                </Label>
                <textarea
                  id="notes"
                  value={form.notes}
                  onChange={e=>setForm({...form, notes:e.target.value})}
                  placeholder={businessType?.slug === 'barbershop' ? 'Contoh: Cocok untuk rambut berminyak, tidak lengket, aroma mint segar...' : businessType?.slug ? 'Catatan tambahan tentang produk...' : 'Contoh: Cocok untuk rambut berminyak, tidak lengket, aroma mint segar...'}
                  className="w-full h-20 px-3 py-2 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-gray-500 rounded-md transition-all"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Dynamic Fields berdasarkan Business Type */}
          {businessType && Object.keys(dynamicFields).length > 0 && (
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-indigo-600" />
                  <span>Field Khusus {businessType.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {Object.entries(dynamicFields).map(([fieldName, fieldConfig]) => {
                    // Skip basic fields yang sudah ada
                    if(['name', 'sku', 'price', 'stock', 'category_id', 'active'].includes(fieldName)) {
                      return null
                    }

                    return (
                      <div key={fieldName} className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">
                          {fieldConfig.label}
                          {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        {renderDynamicField(fieldName, fieldConfig)}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status & Image Card */}
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-pink-600" />
                <span>Status & Gambar</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {form.active ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : (
                    <X className="h-6 w-6 text-red-500" />
                  )}
                  <div>
                    <h4 className="font-semibold text-gray-900">Status Produk</h4>
                    <p className="text-sm text-gray-600">
                      {form.active ? 'Produk aktif dan dapat dijual' : 'Produk nonaktif dan tersembunyi'}
                    </p>
                  </div>
                </div>
                <Checkbox
                  id="active"
                  checked={form.active}
                  onCheckedChange={(checked) => setForm({...form, active: checked})}
                  className="h-6 w-6"
                />
              </div>

              <div className="space-y-4">
                <Label className="text-sm font-semibold text-gray-700">
                  Gambar Produk
                </Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-gray-400 transition-colors">
                  <div className="text-center">
                    {form.image ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-center">
                          <div className="rounded-full bg-green-100 p-3">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{form.image.name}</p>
                          <p className="text-xs text-gray-500">{Math.round(form.image.size / 1024)} KB</p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setForm({...form, image: null})}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Hapus Gambar
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-center">
                          <div className="rounded-full bg-blue-100 p-3">
                            <Upload className="h-8 w-8 text-blue-500" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 mb-2">Upload gambar produk</p>
                          <p className="text-xs text-gray-500 mb-4">PNG, JPG hingga 2MB</p>
                          <Input
                            id="image"
                            type="file"
                            accept="image/*"
                            onChange={e=>setForm({...form, image:e.target.files?.[0] || null})}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById('image').click()}
                          >
                            <Camera className="h-4 w-4 mr-2" />
                            Pilih Gambar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <Button asChild variant="outline" size="lg">
                  <Link to="/inventory" className="flex items-center gap-2">
                    <ArrowLeft className="h-5 w-5" />
                    Batal
                  </Link>
                </Button>

                <Button
                  type="submit"
                  disabled={loading || !form.name || !form.sku}
                  size="lg"
                  className="bg-gray-900 hover:bg-gray-800 text-white font-medium transition-colors px-8"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5 mr-2" />
                      {editing ? 'Update Produk' : 'Simpan Produk'}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  )
}
