import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { apiGet, apiPost } from '../api'
import { formatDateOnly, formatTimeOnly } from '../utils/formatters'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Badge } from '../components/ui/badge'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { LoadingSpinner } from '../components/ui/loading'
import {
  ArrowRightLeft, Search, Plus, Eye, Package, Building2,
  CheckCircle, Truck, AlertCircle, X, ArrowRight
} from 'lucide-react'

export default function StockTransfer(){
  const { token, logout } = useAuth()
  const [list, setList] = useState({ data:[], meta:{} })
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [form, setForm] = useState({ from_location:'', to_location:'', from_branch_id:'', to_branch_id:'', notes:'' })
  const [q, setQ] = useState('')
  const [products, setProducts] = useState([])
  const [qty, setQty] = useState(1)
  const [branches, setBranches] = useState([])

  const [loadingList, setLoadingList] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  async function load(page=1){ setLoadingList(true); try{ setList(await apiGet(`/stock-transfers?page=${page}`, token)) } finally{ setLoadingList(false) } }
  async function create(){ const tf = await apiPost('/stock-transfers', form, token); setForm({ from_location:'', to_location:'', notes:'' }); await load(); open(tf.id) }
  async function open(id){ setLoadingDetail(true); try{ const tf = await apiGet(`/stock-transfers/${id}`, token); setSelected(tf.id); setDetail(tf) } finally { setLoadingDetail(false) } }
  async function search(){ if(!q){ setProducts([]); return } const res=await apiGet(`/products?q=${encodeURIComponent(q)}&per_page=25`, token); setProducts(res.data||[]) }
  async function addItem(p){ await apiPost(`/stock-transfers/${selected}/items`, { product_id:p.id, quantity:Number(qty||1) }, token); open(selected) }
  async function updateItem(itemId, quantity){
    const base = import.meta.env.VITE_API_BASE || 'http://localhost/api/v1'
    const res = await fetch(`${base}/stock-transfers/${selected}/items/${itemId}`, { method:'PUT', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ quantity:Number(quantity||1) }) })
    if(!res.ok){ const d=await res.json().catch(()=>({})); alert(d.message||'Gagal update item'); return }
    open(selected)
  }
  async function setStatus(status){ await apiPost(`/stock-transfers/${selected}/status`, { status }, token); open(selected); load() }

  useEffect(()=>{ (async()=>{ const bs=await apiGet('/branches', token); setBranches(bs) })(); load() },[])
  const pagination=[]; const current=list.current_page||1; const last=list.last_page||1; for(let i=1;i<=last;i++){ pagination.push(i) }

  const getStatusBadge = (status) => {
    const statusConfig = {
      'draft': { color: 'bg-gray-100 text-gray-800 border-gray-300', icon: AlertCircle, text: 'Draft' },
      'approved': { color: 'bg-blue-100 text-blue-800 border-blue-300', icon: CheckCircle, text: 'Disetujui' },
      'shipped': { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Truck, text: 'Dikirim' },
      'received': { color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle, text: 'Diterima' },
      'cancelled': { color: 'bg-red-100 text-red-800 border-red-300', icon: X, text: 'Dibatalkan' }
    }
    const config = statusConfig[status] || statusConfig['draft']
    const Icon = config.icon

    return (
      <Badge variant="outline" className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.text}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 px-8 py-12 text-white">
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-white/10 p-3">
                <ArrowRightLeft className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Transfer Stok</h1>
                <p className="text-cyan-100">Kelola perpindahan stok antar lokasi atau cabang</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="secondary" size="lg" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
              <Link to="/inventory" className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Inventory
              </Link>
            </Button>
            <Button
              onClick={create}
              size="lg"
              className="bg-white text-cyan-600 hover:bg-white/90 font-semibold"
            >
              <Plus className="h-5 w-5 mr-2" />
              Buat Transfer
            </Button>
          </div>
        </div>
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10"></div>
        <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-white/5"></div>
      </div>

      {/* Create Transfer Form */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-cyan-600" />
            <span>Buat Transfer Baru</span>
          </CardTitle>
          <CardDescription>
            Atur perpindahan stok antar cabang atau lokasi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Dari Cabang</Label>
              <Select value={form.from_branch_id} onValueChange={value => setForm({...form, from_branch_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih cabang asal" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map(b => (
                    <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ke Cabang</Label>
              <Select value={form.to_branch_id} onValueChange={value => setForm({...form, to_branch_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih cabang tujuan" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map(b => (
                    <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Catatan</Label>
              <Input
                placeholder="Catatan transfer..."
                value={form.notes}
                onChange={e => setForm({...form, notes: e.target.value})}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={create}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Buat Transfer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className={`grid gap-6 ${
        detail ? 'lg:grid-cols-3' : 'lg:grid-cols-1'
      }`}>
        {/* Transfer List */}
        <div className={detail ? 'lg:col-span-2' : 'lg:col-span-1'}>
          <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5 text-cyan-600" />
                <span>Daftar Transfer</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingList ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
                  <LoadingSpinner size="sm" />
                  <span>Memuat daftar transfer...</span>
                </div>
              ) : list.data?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="rounded-full bg-gray-100 p-6 mb-4">
                    <ArrowRightLeft className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum ada transfer</h3>
                  <p className="text-gray-500 text-center mb-6 max-w-sm">
                    Buat transfer stok pertama untuk memindahkan barang antar lokasi.
                  </p>
                  <Button
                    onClick={create}
                    size="lg"
                    className="bg-gradient-to-r from-cyan-600 to-blue-600"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Buat Transfer Pertama
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <TableRow className="border-0">
                      <TableHead className="font-semibold text-gray-700">Transfer</TableHead>
                      <TableHead className="font-semibold text-gray-700">Status</TableHead>
                      <TableHead className="font-semibold text-gray-700">Rute</TableHead>
                      <TableHead className="font-semibold text-gray-700">Tanggal</TableHead>
                      <TableHead className="font-semibold text-gray-700 w-20">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.data?.map((tf, index) => (
                      <TableRow
                        key={tf.id}
                        className="hover:bg-cyan-50/50 transition-colors border-gray-100 group cursor-pointer"
                        onClick={() => open(tf.id)}
                      >
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                              {tf.number ? tf.number.slice(-2) : index + 1}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{tf.number}</div>
                              <div className="text-sm text-gray-500">
                                ID: {tf.id}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(tf.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{tf.from_location || 'Lokasi A'}</span>
                            <ArrowRight className="h-3 w-3 text-gray-400" />
                            <span className="text-sm font-medium">{tf.to_location || 'Lokasi B'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium text-gray-900">
                            {formatDateOnly(tf.created_at)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatTimeOnly(tf.created_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              open(tf.id)
                            }}
                            className="h-8 w-8 p-0 hover:bg-cyan-100 hover:text-cyan-600 opacity-0 group-hover:opacity-100 transition-all"
                            title="Lihat Detail"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
          <div style={{marginTop:8, display:'flex', gap:4, flexWrap:'wrap'}}>
            {pagination.map(p => (<button key={p} disabled={p===current} onClick={()=>load(p)}>{p}</button>))}
          </div>
            </CardContent>
          </Card>
        </div>

        {/* Transfer Detail Panel */}
        {detail && (
          <div className="lg:col-span-1">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-cyan-600" />
                  <span>Detail Transfer</span>
                </CardTitle>
                <CardDescription>
                  {detail.number} • {getStatusBadge(detail.status)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add Products */}
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <Input
                        placeholder="Cari produk (nama/SKU)"
                        value={q}
                        onChange={e => setQ(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <Input
                      type="number"
                      min={1}
                      value={qty}
                      onChange={e => setQty(e.target.value)}
                      className="text-sm"
                      placeholder="Qty"
                    />
                  </div>
                  <Button
                    onClick={search}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Cari Produk
                  </Button>
                </div>

                {/* Product Search Results */}
                {products.length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {products.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-900 truncate">{p.name}</div>
                          <div className="text-xs text-gray-500">SKU: {p.sku}</div>
                        </div>
                        <Button
                          size="sm"
                          disabled={detail.status !== 'draft'}
                          onClick={() => addItem(p)}
                          className="h-6 text-xs"
                        >
                          +{qty}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Items List */}
                {detail.items && detail.items.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="max-h-60 overflow-y-auto">
                      <Table>
                        <TableHeader className="bg-gray-50 sticky top-0">
                          <TableRow>
                            <TableHead className="text-xs p-2">Produk</TableHead>
                            <TableHead className="text-xs p-2 w-20 text-center">Qty</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {detail.items.map(it => (
                            <TableRow key={it.id} className="text-xs">
                              <TableCell className="p-2">
                                <div className="font-medium text-gray-900 truncate" title={it.product?.name}>
                                  {it.product?.name || it.product_id}
                                </div>
                              </TableCell>
                              <TableCell className="p-2">
                                <Input
                                  type="number"
                                  min={1}
                                  value={it.quantity}
                                  onChange={e => updateItem(it.id, e.target.value)}
                                  disabled={detail.status !== 'draft'}
                                  className="h-6 text-xs text-center border-0 bg-transparent focus:bg-white focus:border-cyan-300"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {/* Status Actions */}
                <div className="space-y-2">
                  {detail.status === 'draft' && (
                    <>
                      <Button
                        onClick={() => setStatus('approved')}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        size="sm"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Setujui Transfer
                      </Button>
                      <Button
                        onClick={() => setStatus('cancelled')}
                        variant="destructive"
                        className="w-full"
                        size="sm"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Batalkan Transfer
                      </Button>
                    </>
                  )}
                  {detail.status === 'approved' && (
                    <Button
                      onClick={() => setStatus('shipped')}
                      className="w-full bg-yellow-600 hover:bg-yellow-700"
                      size="sm"
                    >
                      <Truck className="h-4 w-4 mr-2" />
                      Kirim Barang
                    </Button>
                  )}
                  {detail.status === 'shipped' && (
                    <Button
                      onClick={() => setStatus('received')}
                      className="w-full bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Konfirmasi Diterima
                    </Button>
                  )}
                </div>

                {/* Summary */}
                <div className="bg-cyan-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Total Items:</span>
                    <span className="font-bold">{detail.items?.length || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
