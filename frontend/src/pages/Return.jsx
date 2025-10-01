import { useEffect, useState } from 'react'
import { useAuth } from '../AuthContext'
import { apiGet, apiPost } from '../api'
import { formatMoney } from '../utils/currency'
import useCurrency from '../hooks/useCurrency'
import { formatDateOnly, formatTimeOnly } from '../utils/formatters'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Badge } from '../components/ui/badge'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import {
  RotateCcw, Search, History as HistoryIcon, ShoppingCart,
  Package, Calendar, DollarSign, FileText, CheckCircle,
  AlertCircle, Loader2, Scissors, User, Clock, Utensils, ChefHat
} from 'lucide-react'

function money(n){ return new Intl.NumberFormat('id-ID').format(n||0) }

export default function ReturnPage(){
  const { token, logout, activeTenant } = useAuth()
  const businessType = activeTenant?.business_type || 'barbershop'
  const currency = useCurrency('IDR')
  const [number, setNumber] = useState('')
  const [sale, setSale] = useState(null)
  const [rows, setRows] = useState([])
  const [reason, setReason] = useState('')
  const [method, setMethod] = useState('cash')
  const [reference, setReference] = useState('')
  const [loading, setLoading] = useState(false)
  const [availableTransactions, setAvailableTransactions] = useState([])
  const nav = useNavigate()

  useEffect(()=>{
    // Load available transactions on component mount
    const isMockMode = import.meta.env.VITE_MOCK_BARBERSHOP === "true" || true;
    if (isMockMode) {
      const storageKey = businessType === 'restaurant' ? 'restaurant_sales' : 'barbershop_sales';
      const mockSales = JSON.parse(localStorage.getItem(storageKey) || '[]');
      console.log('Total transactions in localStorage:', mockSales.length);
      setAvailableTransactions(mockSales.slice(-10).reverse()); // Show last 10 transactions, newest first
    }
  },[token])

  async function find(){
    if(!number){ alert('Masukkan nomor transaksi'); return }
    setLoading(true)

    const isMockMode = import.meta.env.VITE_MOCK_BARBERSHOP === "true" || true;

    try{
      if (isMockMode) {
        // Load from localStorage for mock mode
        const storageKey = businessType === 'restaurant' ? 'restaurant_sales' : 'barbershop_sales';
        const mockSales = JSON.parse(localStorage.getItem(storageKey) || '[]');
        console.log('Available sales:', mockSales.map(s => ({ number: s.number, date: s.created_at })));
        console.log('Searching for:', number);

        const sale = mockSales.find(s => s.number === number);
        if (!sale) {
          const availableNumbers = mockSales.map(s => s.number).join(', ');
          alert(`Transaksi dengan nomor "${number}" tidak ditemukan.\n\nNomor transaksi yang tersedia: ${availableNumbers || 'Tidak ada transaksi'}`);
          setSale(null);
          setRows([]);
          return;
        }
        setSale(sale);

        // Handle cases where items might be undefined or empty
        if (sale.items && Array.isArray(sale.items) && sale.items.length > 0) {
          setRows(sale.items.map(it=>({
            sale_item_id: it.id,
            name: it.product_name || it.service_name || it.name,
            price: it.unit_price || it.price,
            maxQty: it.qty || 1,
            qty: 0,
            service_category: it.service_category || (businessType === 'restaurant' ? 'Menu Restaurant' : 'Layanan Barbershop'),
            duration: it.estimated_duration || 30,
            barber: it.barber_name || it.barber || (businessType === 'restaurant' ? 'Staff Restaurant' : 'Barber')
          })));
        } else {
          console.warn('No items found in transaction:', sale);
          alert('Transaksi ini tidak memiliki item yang dapat dibatalkan.');
          setRows([]);
          setSale(null);
          return;
        }
      } else {
        // Try API first, fallback to localStorage
        try {
          const data = await apiGet(`/sales/by-number?number=${encodeURIComponent(number)}`, token)
          setSale(data)

          // Handle cases where items might be undefined or empty
          if (data.items && Array.isArray(data.items) && data.items.length > 0) {
            setRows(data.items.map(it=>({
              sale_item_id: it.id,
              name: it.product_name || it.service_name,
              price: it.unit_price,
              maxQty: it.qty,
              qty: 0,
              service_category: it.service_category || (businessType === 'restaurant' ? 'Menu' : 'Layanan'),
              duration: it.estimated_duration || 30,
              barber: it.barber_name || (businessType === 'restaurant' ? 'Staff Restaurant' : 'Barber')
            })));
          } else {
            console.warn('No items found in API transaction:', data);
            alert('Transaksi ini tidak memiliki item yang dapat dibatalkan.');
            setRows([]);
            setSale(null);
            return;
          }
        } catch (apiError) {
          console.warn('API not available, checking localStorage:', apiError.message);
          // Fallback to localStorage
          const storageKey = businessType === 'restaurant' ? 'restaurant_sales' : 'barbershop_sales';
          const mockSales = JSON.parse(localStorage.getItem(storageKey) || '[]');
          const sale = mockSales.find(s => s.number === number);
          if (!sale) {
            alert('Transaksi dengan nomor tersebut tidak ditemukan');
            setSale(null);
            setRows([]);
            return;
          }
          setSale(sale);

          // Handle cases where items might be undefined or empty
          if (sale.items && Array.isArray(sale.items) && sale.items.length > 0) {
            setRows(sale.items.map(it=>({
              sale_item_id: it.id,
              name: it.product_name || it.service_name || it.name,
              price: it.unit_price || it.price,
              maxQty: it.qty || 1,
              qty: 0,
              service_category: it.service_category || (businessType === 'restaurant' ? 'Menu Restaurant' : 'Layanan Barbershop'),
              duration: it.estimated_duration || 30,
              barber: it.barber_name || it.barber || (businessType === 'restaurant' ? 'Staff Restaurant' : 'Barber')
            })));
          } else {
            console.warn('No items found in fallback transaction:', sale);
            alert('Transaksi ini tidak memiliki item yang dapat dibatalkan.');
            setRows([]);
            setSale(null);
            return;
          }
        }
      }
    }catch(e){
      console.error('Failed to find transaction:', e);
      alert('Terjadi kesalahan saat mencari transaksi');
      setSale(null);
      setRows([]);
    } finally{
      setLoading(false)
    }
  }

  function setQty(index, qty){
    setRows(prev=>{
      const n=[...prev];
      n[index] = { ...n[index], qty: Math.max(0, Math.min(Number(qty||0), n[index].maxQty)) }
      return n
    })
  }

  async function submit(){
    const items = rows.filter(r=>r.qty>0).map(r=>({ sale_item_id: r.sale_item_id, qty: r.qty }))
    if(items.length===0){ alert(`Pilih minimal satu ${businessType === 'restaurant' ? 'pesanan' : 'layanan'} untuk dibatalkan`); return }
    setLoading(true)
    try{
      const res = await apiPost('/returns', { sale_number: number, items, method, reference, reason }, token)
      alert(`Pembatalan ${businessType === 'restaurant' ? 'pesanan' : 'layanan'} berhasil (#${res.number}) total pengembalian ${formatMoney(res.total_refund, currency)}`)
      nav(`/receipt/${res.sale_id}`)
    }catch(e){ alert(e.message) } finally { setLoading(false) }
  }

  return (
    <div className="space-y-6">
      {/* Header Section - Compact & Professional */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <RotateCcw className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{businessType === 'restaurant' ? 'Pembatalan Pesanan' : 'Pembatalan Layanan'}</h1>
              <p className="text-sm text-gray-600">{businessType === 'restaurant' ? 'Proses pembatalan pesanan dan pengembalian dana' : 'Proses pembatalan layanan dan pengembalian dana'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="text-gray-700 border-gray-300">
              <Link to="/cashier" className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Kasir
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="text-gray-700 border-gray-300">
              <Link to="/history" className="flex items-center gap-2">
                <HistoryIcon className="h-4 w-4" />
                Riwayat
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Search Transaction */}
      <Card className="shadow-sm border border-gray-200">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Search className="h-5 w-5 text-gray-600" />
            <span>Cari Transaksi</span>
          </CardTitle>
          <CardDescription>
            Masukkan nomor transaksi untuk memulai proses pembatalan {businessType === 'restaurant' ? 'pesanan' : 'layanan'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="transaction-number">Nomor Transaksi</Label>
              <Input
                id="transaction-number"
                placeholder="Masukkan nomor transaksi..."
                value={number}
                onChange={e => setNumber(e.target.value)}
                className="h-12 text-lg font-mono"
                onKeyDown={e => e.key === 'Enter' && find()}
              />
            </div>
            <Button
              onClick={find}
              disabled={loading || !number}
              size="lg"
              className="h-12 bg-gray-900 hover:bg-gray-800 text-white px-8"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Mencari...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Cari Transaksi
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Available Transactions */}
      {!sale && (
        <Card className="shadow-sm border border-gray-200">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <HistoryIcon className="h-5 w-5 text-gray-600" />
              <span>Transaksi Tersedia untuk Pembatalan</span>
            </CardTitle>
            <CardDescription>
              Klik nomor transaksi untuk mengisi form otomatis
            </CardDescription>
          </CardHeader>
          <CardContent>
            {availableTransactions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableTransactions.map((transaction, index) => (
                  <div
                    key={transaction.id || index}
                    onClick={() => setNumber(transaction.number)}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <code className="text-sm font-mono font-semibold text-blue-600">
                        {transaction.number}
                      </code>
                      <Badge variant="outline" className="text-xs">
                        {formatMoney(transaction.grand_total, currency)}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(transaction.created_at).toLocaleDateString('id-ID')}
                    </div>
                    {transaction.customer_name && (
                      <div className="text-xs text-gray-500 mt-1">
                        {transaction.customer_name}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="rounded-full bg-gray-100 p-6 mb-4 w-20 h-20 mx-auto flex items-center justify-center">
                  <ShoppingCart className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Transaksi</h3>
                <p className="text-gray-500 mb-4">
                  Belum ada transaksi yang dapat dibatalkan. Lakukan transaksi terlebih dahulu.
                </p>
                <Button asChild className="bg-blue-600 hover:bg-blue-700">
                  <Link to="/service-pos" className="flex items-center gap-2">
                    {businessType === 'restaurant' ? <Utensils className="h-4 w-4" /> : <Scissors className="h-4 w-4" />}
                    Buat Transaksi Baru
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Transaction Details & Return Form */}
      {sale && (
        <div className="space-y-6">
          {/* Transaction Info */}
          <Card className="shadow-sm border border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-gray-600" />
                <span>Detail Transaksi</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Nomor Transaksi</div>
                    <div className="font-semibold text-lg">{sale.number}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Tanggal & Waktu</div>
                    <div className="font-semibold">
                      {formatDateOnly(sale.created_at)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatTimeOnly(sale.created_at)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Total Transaksi</div>
                    <div className="font-bold text-lg">{formatMoney(sale.grand_total, currency)}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Return Items */}
          <Card className="shadow-sm border border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                {businessType === 'restaurant' ? <Utensils className="h-5 w-5 text-gray-600" /> : <Scissors className="h-5 w-5 text-gray-600" />}
                <span>{businessType === 'restaurant' ? 'Pesanan yang Akan Dibatalkan' : 'Layanan yang Akan Dibatalkan'}</span>
              </CardTitle>
              <CardDescription>
                Pilih {businessType === 'restaurant' ? 'menu dan tentukan jumlah item yang akan dibatalkan' : 'layanan dan tentukan jumlah sesi yang akan dibatalkan'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow className="border-0">
                      <TableHead className="font-semibold text-gray-700">{businessType === 'restaurant' ? 'Menu' : 'Layanan'}</TableHead>
                      <TableHead className="font-semibold text-gray-700 text-center">{businessType === 'restaurant' ? 'Qty Dibeli' : 'Sesi Dibeli'}</TableHead>
                      <TableHead className="font-semibold text-gray-700 text-center">{businessType === 'restaurant' ? 'Qty Batal' : 'Sesi Batal'}</TableHead>
                      <TableHead className="font-semibold text-gray-700 text-right">{businessType === 'restaurant' ? 'Harga/Item' : 'Tarif/Sesi'}</TableHead>
                      <TableHead className="font-semibold text-gray-700 text-right">Total Pengembalian</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r, idx) => (
                      <TableRow key={r.sale_item_id} className="hover:bg-orange-50/50 transition-colors">
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white">
                              {businessType === 'restaurant' ? <ChefHat className="h-5 w-5" /> : <Scissors className="h-5 w-5" />}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{r.name}</div>
                              <div className="text-sm text-gray-500 flex items-center gap-3">
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {r.barber}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {r.duration} menit
                                </span>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {r.maxQty} {businessType === 'restaurant' ? 'item' : 'sesi'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Input
                            type="number"
                            min={0}
                            max={r.maxQty}
                            value={r.qty}
                            onChange={e => setQty(idx, e.target.value)}
                            className="w-20 text-center font-semibold"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-semibold">{formatMoney(r.price, currency)}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-bold text-orange-600">{formatMoney(r.price * r.qty, currency)}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Return Summary */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-700">Total Pengembalian:</span>
                  <span className="text-2xl font-bold text-gray-900">{formatMoney(rows.reduce((sum, r) => sum + (r.price * r.qty), 0), currency)}</span>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {rows.filter(r => r.qty > 0).length} {businessType === 'restaurant' ? 'pesanan' : 'layanan'} akan dibatalkan
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Return Details Form */}
          <Card className="shadow-sm border border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-gray-600" />
                <span>Detail Pembatalan</span>
              </CardTitle>
              <CardDescription>
                Lengkapi informasi untuk proses pembatalan {businessType === 'restaurant' ? 'pesanan' : 'layanan'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="reason">Alasan Pembatalan</Label>
                  <Select value={reason} onValueChange={setReason}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Pilih alasan pembatalan..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer_request">Permintaan pelanggan</SelectItem>
                      <SelectItem value="barber_unavailable">{businessType === 'restaurant' ? 'Staff tidak tersedia' : 'Barber tidak tersedia'}</SelectItem>
                      <SelectItem value="time_conflict">Konflik jadwal</SelectItem>
                      <SelectItem value="service_issue">{businessType === 'restaurant' ? 'Masalah pesanan' : 'Masalah layanan'}</SelectItem>
                      <SelectItem value="emergency">Keadaan darurat</SelectItem>
                      <SelectItem value="other">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="method">Metode Pengembalian Dana</Label>
                  <Select value={method} onValueChange={setMethod}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Tunai</SelectItem>
                      <SelectItem value="qris">QRIS / E-Wallet</SelectItem>
                      <SelectItem value="transfer">Transfer Bank</SelectItem>
                      <SelectItem value="store_credit">Kredit Toko</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="reference">Catatan Tambahan (Opsional)</Label>
                <Input
                  id="reference"
                  placeholder="Catatan khusus untuk pembatalan ini..."
                  value={reference}
                  onChange={e => setReference(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  onClick={submit}
                  disabled={loading || rows.filter(r => r.qty > 0).length === 0}
                  size="lg"
                  className="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-semibold"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Memproses Pembatalan...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Batalkan {businessType === 'restaurant' ? 'Pesanan' : 'Layanan'}
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setSale(null)
                    setRows([])
                    setNumber('')
                    setReason('')
                    setReference('')
                  }}
                  variant="outline"
                  size="lg"
                  className="px-8"
                >
                  Batal
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}



