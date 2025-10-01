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
import {
  ArrowLeft, Save, Package, Hash, FolderOpen, DollarSign,
  Hash as HashIcon, ImageIcon, ToggleLeft, ToggleRight, Loader2,
  Upload, X, Eye, CheckCircle, AlertCircle, Camera
} from 'lucide-react'

export default function ProductForm(){
  const { token, logout } = useAuth()
  const { id } = useParams()
  const editing = !!id
  const nav = useNavigate()
  const [cats, setCats] = useState([])
  const [form, setForm] = useState({ name:'', sku:'', category_id:'', price:'', stock:'', active:true, image:null })
  const [loading, setLoading] = useState(false)
  const currency = useCurrency('IDR')

  useEffect(()=>{ (async()=>{
    try {
      const c = await apiGet('/categories?per_page=100', token)
      setCats(c.data||[])
    } catch (e) {
      console.error('Failed to load categories:', e)
      setCats([])
    }

    if(editing){
      try {
        const p = await apiGet(`/admin/products/${id}`, token)
        setForm({ name:p.name||'', sku:p.sku||'', category_id:p.category_id||'', price:p.price||0, stock:p.stock||0, active:!!p.active, image:null })
      } catch (e) {
        console.error('Failed to load product:', e)
        alert('Failed to load product: ' + e.message)
      }
    }
  })() },[id, token])

  async function submit(e){
    e.preventDefault()
    setLoading(true)
    try{
      const fd = new FormData()
      fd.append('name', form.name)
      fd.append('sku', form.sku)
      if(form.category_id) fd.append('category_id', form.category_id)
      fd.append('price', form.price)
      fd.append('stock', form.stock)
      fd.append('active', form.active ? '1' : '0')
      if(form.image) fd.append('image', form.image)
      const method = editing ? 'PUT' : 'POST'
      const url = editing ? `/admin/products/${id}` : '/admin/products'
      const res = await fetch((import.meta.env.VITE_API_BASE||'http://localhost/api/v1')+url, { method, headers: { Authorization: `Bearer ${token}` }, body: fd })
      const data = await res.json().catch(()=>({}))
      if(!res.ok) throw new Error(data.message || 'Gagal simpan produk')
      nav('/inventory')
    }catch(e){ alert(e.message) } finally{ setLoading(false) }
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-8 py-12 text-white">
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-white/10 p-3">
                <Package className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">
                  {editing ? 'Edit Produk' : 'Tambah Produk Baru'}
                </h1>
                <p className="text-emerald-100">
                  {editing ? 'Perbarui informasi produk' : 'Tambahkan produk baru ke inventori'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="secondary" size="lg" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
              <Link to="/inventory" className="flex items-center gap-2">
                <ArrowLeft className="h-5 w-5" />
                Kembali ke Inventori
              </Link>
            </Button>
          </div>
        </div>
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10"></div>
        <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-white/5"></div>
      </div>

      {/* Form Container */}
      <div className="max-w-4xl mx-auto">
        <form onSubmit={submit} className="space-y-8">
          {/* Basic Information Card */}
          <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-emerald-600" />
                <span>Informasi Dasar</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                    Nama Produk *
                  </Label>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="name"
                      value={form.name}
                      onChange={e=>setForm({...form, name:e.target.value})}
                      placeholder="Contoh: Smartphone Samsung Galaxy"
                      className="pl-10 h-12 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all"
                      required
                    />
                  </div>
                  {form.name && (
                    <div className="flex items-center gap-1 text-xs text-emerald-600">
                      <CheckCircle className="h-3 w-3" />
                      Nama produk terisi
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sku" className="text-sm font-semibold text-gray-700">
                    SKU (Stock Keeping Unit) *
                  </Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="sku"
                      value={form.sku}
                      onChange={e=>setForm({...form, sku:e.target.value.toUpperCase()})}
                      placeholder="Contoh: PHONE-001"
                      className="pl-10 h-12 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all"
                      required
                    />
                  </div>
                  {form.sku && (
                    <div className="flex items-center gap-1 text-xs text-emerald-600">
                      <CheckCircle className="h-3 w-3" />
                      SKU terisi
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  Kategori Produk
                </Label>
                <Select
                  value={form.category_id?.toString() || ""}
                  onValueChange={(value) => setForm({...form, category_id: value || ''})}
                >
                  <SelectTrigger className="h-12 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500">
                    <SelectValue placeholder="Pilih kategori produk" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                        Tanpa Kategori
                      </div>
                    </SelectItem>
                    {cats.map(c => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                          {c.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Inventory Card */}
          <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                <span>Harga & Inventori</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-sm font-semibold text-gray-700">
                    Harga Jual ({currency}) *
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.price}
                      onChange={e=>setForm({...form, price:e.target.value})}
                      placeholder="0"
                      className="pl-10 h-12 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all"
                      required
                    />
                  </div>
                  {form.price && (
                    <div className="text-xs text-gray-600">
                      {formatMoney(form.price||0, currency)}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock" className="text-sm font-semibold text-gray-700">
                    Jumlah Stok *
                  </Label>
                  <div className="relative">
                    <HashIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="stock"
                      type="number"
                      min="0"
                      value={form.stock}
                      onChange={e=>setForm({...form, stock:e.target.value})}
                      placeholder="0"
                      className="pl-10 h-12 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all"
                      required
                    />
                  </div>
                  {form.stock && (
                    <div className={`text-xs ${form.stock <= 5 ? 'text-red-600' : form.stock <= 10 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {form.stock <= 5 ? (
                        <div className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Stok rendah
                        </div>
                      ) : (
                        `${form.stock} unit tersedia`
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status & Image Card */}
          <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-emerald-600" />
                <span>Status & Gambar</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {form.active ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : (
                    <X className="h-6 w-6 text-gray-400" />
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
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-emerald-400 transition-colors">
                  <div className="text-center">
                    {form.image ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-center">
                          <div className="rounded-full bg-emerald-100 p-3">
                            <CheckCircle className="h-8 w-8 text-emerald-600" />
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
                          <div className="rounded-full bg-gray-100 p-3">
                            <Upload className="h-8 w-8 text-gray-400" />
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
          <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
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
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all px-8"
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