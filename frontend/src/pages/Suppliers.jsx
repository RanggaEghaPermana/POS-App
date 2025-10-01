import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { apiGet } from '../api'
import { formatMoney } from '../utils/currency'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Badge } from '../components/ui/badge'
import { Label } from '../components/ui/label'
import { LoadingSpinner } from '../components/ui/loading'
import {
  Truck, Search, Filter, Eye, Edit, Trash2, Plus, X,
  Building2, Phone, Mail, MapPin, CreditCard, Star,
  ChevronLeft, ChevronRight, Save, Package, Clock
} from 'lucide-react'

function money(n){ return new Intl.NumberFormat('id-ID').format(n||0) }

export default function Suppliers(){
  const { token, logout } = useAuth()
  const [currency, setCurrency] = useState('IDR')
  const [q, setQ] = useState('')
  const [list, setList] = useState({ data:[], meta:{} })
  const [form, setForm] = useState({ name:'', contact_name:'', phone:'', email:'', address:'', payment_terms:'', rating:'', notes:'' })
  const [selected, setSelected] = useState(null)
  const [mapping, setMapping] = useState([])
  const [mapForm, setMapForm] = useState({ product_id:'', supplier_sku:'', cost_price:'', lead_time_days:'' })
  const [showForm, setShowForm] = useState(false)
  const [loadingList, setLoadingList] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)

  async function load(page=1){
    setLoadingList(true)
    const p = new URLSearchParams()
    if(q) p.set('q', q)
    p.set('page', page)
    p.set('per_page', 20)
    try { setList(await apiGet(`/suppliers?${p.toString()}`, token)) }
    finally { setLoadingList(false) }
  }

  async function show(id){
    setLoadingDetail(true)
    const s = await apiGet(`/suppliers/${id}`, token)
    setSelected(s)
    setMapping(s.products || [])
    setForm({
      name: s.name || '',
      contact_name: s.contact_name || '',
      phone: s.phone || '',
      email: s.email || '',
      address: s.address || '',
      payment_terms: s.payment_terms || '',
      rating: s.rating || '',
      notes: s.notes || ''
    })
    setShowForm(true)
    setLoadingDetail(false)
  }

  async function save(){
    const base = import.meta.env.VITE_API_BASE || 'http://localhost/api/v1'
    const method = selected ? 'PUT' : 'POST'
    const url = selected ? `${base}/suppliers/${selected.id}` : `${base}/suppliers`
    const res = await fetch(url, {
      method,
      headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`},
      body: JSON.stringify(form)
    })
    const data = await res.json().catch(()=>({}))
    if(!res.ok){
      alert(data.message||'Gagal menyimpan data supplier')
      return
    }
    setForm({ name:'', contact_name:'', phone:'', email:'', address:'', payment_terms:'', rating:'', notes:'' })
    setSelected(null)
    setShowForm(false)
    load()
  }

  async function del(id){
    if(!confirm('Apakah Anda yakin ingin menghapus supplier ini?')) return
    const base = import.meta.env.VITE_API_BASE || 'http://localhost/api/v1'
    const res = await fetch(`${base}/suppliers/${id}`, {
      method:'DELETE',
      headers:{ Authorization:`Bearer ${token}` }
    })
    const data = await res.json().catch(()=>({}))
    if(!res.ok){
      alert(data.message||'Gagal menghapus supplier')
      return
    }
    if(selected?.id===id) {
      setSelected(null)
      setShowForm(false)
    }
    load()
  }

  async function addMap(){
    const base = import.meta.env.VITE_API_BASE || 'http://localhost/api/v1'
    const res = await fetch(`${base}/suppliers/${selected.id}/products`, {
      method:'POST',
      headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
      body: JSON.stringify(mapForm)
    })
    const data = await res.json().catch(()=>({}))
    if(!res.ok){
      alert(data.message||'Gagal menambah mapping produk')
      return
    }
    show(selected.id)
    setMapForm({ product_id:'', supplier_sku:'', cost_price:'', lead_time_days:'' })
  }

  async function delMap(id){
    const base = import.meta.env.VITE_API_BASE || 'http://localhost/api/v1'
    const res = await fetch(`${base}/suppliers/${selected.id}/products/${id}`, {
      method:'DELETE',
      headers:{ Authorization:`Bearer ${token}` }
    })
    if(!res.ok){
      const data=await res.json().catch(()=>({}))
      alert(data.message||'Gagal menghapus mapping produk')
    }
    show(selected.id)
  }

  const resetForm = () => {
    setForm({ name:'', contact_name:'', phone:'', email:'', address:'', payment_terms:'', rating:'', notes:'' })
    setSelected(null)
    setShowForm(false)
  }

  const getRatingStars = (rating) => {
    const stars = []
    const ratingNum = parseInt(rating) || 0
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`h-4 w-4 ${
            i <= ratingNum ? 'text-yellow-400 fill-current' : 'text-gray-300'
          }`}
        />
      )
    }
    return stars
  }

  useEffect(()=>{ load() },[])

  const pagination=[]
  const current=list.current_page||1
  const last=list.last_page||1
  for(let i=1;i<=last;i++){ pagination.push(i) }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 px-8 py-12 text-white">
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-white/10 p-3">
                <Truck className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Data Supplier</h1>
                <p className="text-orange-100">Kelola data supplier dan hubungan bisnis</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="secondary" size="lg" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
              <Link to="/payables" className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Hutang Supplier
              </Link>
            </Button>
            <Button
              onClick={() => setShowForm(true)}
              size="lg"
              className="bg-white text-orange-600 hover:bg-white/90 font-semibold"
            >
              <Plus className="h-5 w-5 mr-2" />
              Tambah Supplier
            </Button>
          </div>
        </div>
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10"></div>
        <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-white/5"></div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-full bg-orange-100 p-3">
                  <Truck className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Supplier</p>
                <p className="text-2xl font-bold text-gray-900">{list.total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-full bg-green-100 p-3">
                  <Star className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Rating Tinggi</p>
                <p className="text-2xl font-bold text-gray-900">
                  {list.data?.filter(s => parseInt(s.rating) >= 4).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-full bg-blue-100 p-3">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Dengan Mapping</p>
                <p className="text-2xl font-bold text-gray-900">
                  {list.data?.filter(s => s.products_count > 0).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-full bg-purple-100 p-3">
                  <Building2 className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Aktif</p>
                <p className="text-2xl font-bold text-gray-900">
                  {list.data?.filter(s => s.active !== false).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter Section */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-orange-600" />
              <span>Pencarian Supplier</span>
            </div>
            <Badge variant="secondary" className="bg-orange-50 text-orange-700">
              {list.data?.length || 0} dari {list.total || 0} supplier
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="relative lg:col-span-8">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Cari nama supplier atau kontak..."
                value={q}
                onChange={e=>setQ(e.target.value)}
                className="pl-10 h-12 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500 transition-all"
              />
            </div>
            <div className="lg:col-span-2">
              <Button
                onClick={() => load()}
                size="lg"
                className="w-full h-12 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
            <div className="lg:col-span-2">
              <Button
                onClick={() => setShowForm(true)}
                variant="outline"
                size="lg"
                className="w-full h-12 border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300 transition-all"
              >
                <Plus className="h-4 w-4 mr-2" />
                Supplier Baru
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className={`grid gap-6 ${
        showForm ? 'lg:grid-cols-3' : 'lg:grid-cols-1'
      }`}>
        {/* Suppliers List */}
        <div className={showForm ? 'lg:col-span-2' : 'lg:col-span-1'}>
          <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
            <CardContent className="p-0">
              {loadingList ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
                  <LoadingSpinner size="sm" />
                  <span>Memuat supplier...</span>
                </div>
              ) : list.data?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="rounded-full bg-gray-100 p-6 mb-4">
                    <Truck className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum ada supplier</h3>
                  <p className="text-gray-500 text-center mb-6 max-w-sm">
                    Tambahkan supplier pertama untuk mulai mengelola hubungan bisnis.
                  </p>
                  <Button
                    onClick={() => setShowForm(true)}
                    size="lg"
                    className="bg-gradient-to-r from-orange-600 to-red-600"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Tambah Supplier Pertama
                  </Button>
                </div>
              ) : (
                <div className="overflow-hidden">
                  <Table>
                    <TableHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <TableRow className="border-0">
                        <TableHead className="font-semibold text-gray-700">Supplier</TableHead>
                        <TableHead className="font-semibold text-gray-700">Kontak</TableHead>
                        <TableHead className="font-semibold text-gray-700">Rating</TableHead>
                        <TableHead className="font-semibold text-gray-700">Produk</TableHead>
                        <TableHead className="font-semibold text-gray-700 w-40">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {list.data?.map((s, index) => (
                        <TableRow
                          key={s.id}
                          className="hover:bg-orange-50/50 transition-colors border-gray-100 group"
                        >
                          <TableCell className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-semibold text-sm">
                                {s.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">{s.name}</div>
                                <div className="text-sm text-gray-500">
                                  {s.contact_name || 'Tidak ada kontak'}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {s.phone && (
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                  <Phone className="h-3 w-3" />
                                  {s.phone}
                                </div>
                              )}
                              {s.email && (
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                  <Mail className="h-3 w-3" />
                                  {s.email}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {getRatingStars(s.rating)}
                              <span className="text-sm text-gray-500 ml-1">
                                ({s.rating || '0'})
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              <Package className="h-3 w-3 mr-1" />
                              {s.products_count || 0} produk
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => show(s.id)}
                                className="h-8 w-8 p-0 hover:bg-orange-100 hover:text-orange-600"
                                title="Lihat Detail"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => show(s.id)}
                                className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
                                title="Edit Supplier"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => del(s.id)}
                                className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                                title="Hapus Supplier"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Modern Pagination */}
          {pagination.length > 1 && (
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm mt-4">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Menampilkan <span className="font-medium">{list.from || 0}</span> sampai{' '}
                    <span className="font-medium">{list.to || 0}</span> dari{' '}
                    <span className="font-medium">{list.total || 0}</span> supplier
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => load(current - 1)}
                      disabled={current === 1}
                      className="hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300 transition-all"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Sebelumnya
                    </Button>

                    <div className="flex items-center gap-1">
                      {pagination.slice(0, 7).map(p => (
                        <Button
                          key={p}
                          variant={p === current ? "default" : "ghost"}
                          size="sm"
                          onClick={() => load(p)}
                          disabled={p === current}
                          className={
                            p === current
                              ? "bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg"
                              : "hover:bg-orange-50 hover:text-orange-600 transition-all"
                          }
                        >
                          {p}
                        </Button>
                      ))}
                      {pagination.length > 7 && (
                        <>
                          <span className="px-2 text-gray-400">...</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => load(last)}
                            className="hover:bg-orange-50 hover:text-orange-600"
                          >
                            {last}
                          </Button>
                        </>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => load(current + 1)}
                      disabled={current === last}
                      className="hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300 transition-all"
                    >
                      Selanjutnya
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Supplier Form */}
        {showForm && (
          <div className="lg:col-span-1">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-orange-600" />
                    <span>{selected ? 'Edit Supplier' : 'Tambah Supplier'}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetForm}
                    className="h-8 w-8 p-0 hover:bg-gray-100"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardTitle>
                <CardDescription>
                  {selected ? 'Edit informasi supplier' : 'Tambah supplier baru ke database'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nama Supplier *</Label>
                    <Input
                      id="name"
                      placeholder="Masukkan nama supplier"
                      value={form.name}
                      onChange={e=>setForm({...form,name:e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="contact_name">Nama Kontak</Label>
                    <Input
                      id="contact_name"
                      placeholder="Masukkan nama kontak"
                      value={form.contact_name}
                      onChange={e=>setForm({...form,contact_name:e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Nomor Telepon</Label>
                    <Input
                      id="phone"
                      placeholder="Masukkan nomor telepon"
                      value={form.phone}
                      onChange={e=>setForm({...form,phone:e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Masukkan email"
                      value={form.email}
                      onChange={e=>setForm({...form,email:e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="address">Alamat</Label>
                    <Input
                      id="address"
                      placeholder="Masukkan alamat lengkap"
                      value={form.address}
                      onChange={e=>setForm({...form,address:e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="payment_terms">Syarat Pembayaran</Label>
                    <Input
                      id="payment_terms"
                      placeholder="Contoh: NET 30"
                      value={form.payment_terms}
                      onChange={e=>setForm({...form,payment_terms:e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="rating">Rating (1-5)</Label>
                    <Input
                      id="rating"
                      type="number"
                      min="1"
                      max="5"
                      placeholder="Rating supplier"
                      value={form.rating}
                      onChange={e=>setForm({...form,rating:e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Catatan</Label>
                    <Input
                      id="notes"
                      placeholder="Catatan tambahan"
                      value={form.notes}
                      onChange={e=>setForm({...form,notes:e.target.value})}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={save}
                    className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {selected ? 'Update' : 'Simpan'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={resetForm}
                    className="px-3"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Product Mapping Section */}
                {selected && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Package className="h-5 w-5 text-blue-600" />
                      Mapping Produk
                    </h4>

                    {/* Add Mapping Form */}
                    <div className="space-y-3 mb-4 p-4 bg-blue-50 rounded-lg">
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Product ID"
                          value={mapForm.product_id}
                          onChange={e=>setMapForm({...mapForm,product_id:e.target.value})}
                        />
                        <Input
                          placeholder="Supplier SKU"
                          value={mapForm.supplier_sku}
                          onChange={e=>setMapForm({...mapForm,supplier_sku:e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Harga Beli"
                          type="number"
                          value={mapForm.cost_price}
                          onChange={e=>setMapForm({...mapForm,cost_price:e.target.value})}
                        />
                        <Input
                          placeholder="Lead Time (hari)"
                          type="number"
                          value={mapForm.lead_time_days}
                          onChange={e=>setMapForm({...mapForm,lead_time_days:e.target.value})}
                        />
                      </div>
                      <Button
                        onClick={addMap}
                        size="sm"
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Tambah Mapping
                      </Button>
                    </div>

                    {/* Mapping List */}
                    {mapping.length > 0 && (
                      <div className="space-y-2">
                        {mapping.map(m => (
                          <div key={m.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">
                                {m.product?.name || `Product #${m.product_id}`}
                              </div>
                              <div className="text-sm text-gray-500">
                                SKU: {m.supplier_sku || '-'} •
                                Harga: {formatMoney(m.cost_price, currency)} •
                                Lead Time: {m.lead_time_days || 0} hari
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => delMap(m.id)}
                              className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 flex-shrink-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
