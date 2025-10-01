import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { apiGet } from '../api'
import { formatMoney } from '../utils/currency'
import useCurrency from '../hooks/useCurrency'
import { formatDateIndonesia } from '../utils/formatters'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Badge } from '../components/ui/badge'
import { Receipt, RotateCcw, Home, Copy as CopyIcon, FileText, User } from 'lucide-react'

export default function SaleDetail(){
  const { id } = useParams()
  const { token } = useAuth()
  const [sale, setSale] = useState(null)
  const currency = useCurrency('IDR')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(()=>{
    (async()=>{
      const isMockMode = import.meta.env.VITE_MOCK_BARBERSHOP === "true" || true;

      if (isMockMode) {
        // Load from localStorage for mock mode
        try {
          const mockSales = JSON.parse(localStorage.getItem('barbershop_sales') || '[]');
          const sale = mockSales.find(s => s.id === id);
          if (sale) {
            setSale(sale);
          } else {
            alert('Detail transaksi tidak ditemukan');
          }
        } catch (error) {
          console.error('Failed to load sale from localStorage:', error);
          alert('Gagal memuat detail transaksi');
        }
      } else {
        // Try API first, fallback to localStorage
        try{
          const s = await apiGet(`/sales/${id}`, token)
          setSale(s)
        }catch(e){
          console.warn('API not available, checking localStorage:', e.message);
          // Fallback to localStorage
          try {
            const mockSales = JSON.parse(localStorage.getItem('barbershop_sales') || '[]');
            const sale = mockSales.find(s => s.id === id);
            if (sale) {
              setSale(sale);
            } else {
              alert('Detail transaksi tidak ditemukan');
            }
          } catch (mockError) {
            alert('Gagal memuat detail transaksi');
          }
        }
      }
      setLoading(false);
    })()
  },[id, token])

  if (loading) return <div className="p-4">Memuat...</div>
  if (!sale) return <div className="p-4">Data tidak ditemukan</div>

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-slate-600 via-gray-600 to-zinc-600 px-8 py-10 text-white">
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-white/10 p-3"><Receipt className="h-7 w-7"/></div>
              <div>
                <h1 className="text-3xl font-bold">Detail Transaksi</h1>
                <div className="flex items-center gap-2 text-white/80">
                  <span>Nomor: {sale.number}</span>
                  <button
                    onClick={()=>{ navigator.clipboard?.writeText(sale.number); }}
                    title="Salin Nomor"
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20"
                  >
                    <CopyIcon className="h-3 w-3"/> Salin
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
              <Link to="/">
                <Home className="h-4 w-4 mr-2"/>Dashboard
              </Link>
            </Button>
            <Button asChild className="bg-white text-slate-700">
              <Link to={`/receipt/${sale.id}`}>
                <Receipt className="h-4 w-4 mr-2"/>Lihat Struk
              </Link>
            </Button>
            <Button
              disabled={creating}
              onClick={async()=>{
                try{
                  setCreating(true)

                  // Check if in mock mode
                  const isMockMode = import.meta.env.VITE_MOCK_BARBERSHOP === "true" || true;

                  if (isMockMode) {
                    // Mock mode - simulate invoice creation
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
                    const mockInvoiceId = `INV-${Date.now()}`;
                    alert(`Invoice berhasil dibuat dengan ID: ${mockInvoiceId}`);
                    // In mock mode, redirect to sale detail instead
                    return;
                  }

                  const base = import.meta.env.VITE_API_BASE || 'http://localhost/api/v1'
                  const res = await fetch(`${base}/invoices`, {
                    method:'POST',
                    headers:{
                      'Content-Type':'application/json',
                      Authorization:`Bearer ${token}`
                    },
                    body: JSON.stringify({ sale_id: sale.id })
                  })

                  if (!res.ok) {
                    if (res.status === 404) {
                      alert('Fitur invoice belum tersedia. Silakan gunakan struk sebagai bukti transaksi.');
                      return;
                    }
                    const data = await res.json().catch(()=>({}))
                    alert(data.message||'Gagal membuat invoice');
                    return;
                  }

                  const data = await res.json()
                  window.location.hash = `#/invoice/${data.id}`
                }catch(e){
                  console.error('Invoice creation error:', e);
                  alert('Fitur invoice sementara tidak tersedia. Silakan gunakan struk sebagai bukti transaksi.');
                } finally {
                  setCreating(false)
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700"
            >
              <FileText className="h-4 w-4 mr-2"/>{creating ? 'Membuat...' : 'Buat/Lihat Invoice'}
            </Button>
            <Button asChild variant="outline">
              <Link to={`/return`}>
                <RotateCcw className="h-4 w-4 mr-2"/>Retur
              </Link>
            </Button>
          </div>
        </div>
        <div className="absolute inset-0 bg-black/20"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle>Informasi Transaksi</CardTitle>
            <CardDescription>Rincian umum transaksi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div><span className="text-gray-600">Nomor:</span> <span className="font-semibold">{sale.number}</span></div>
            <div><span className="text-gray-600">Tanggal:</span> <span className="font-semibold">{formatDateIndonesia(sale.date)}</span></div>
            {sale.cashier && (
              <div className="flex items-center gap-2 text-gray-700">
                <User className="h-4 w-4"/>
                <span>Kasir: <span className="font-medium">{sale.cashier.name}</span></span>
              </div>
            )}
            <div>
              <span className="text-gray-600">Status:</span> {sale.payment_status === 'paid' ? (
                <Badge className="bg-green-100 text-green-800 border-green-300 ml-2">Lunas</Badge>
              ) : (
                <Badge className="bg-amber-100 text-amber-800 border-amber-300 ml-2">Belum Lunas</Badge>
              )}
            </div>
              <div className="pt-2 space-y-1">
                <div className="flex justify-between"><span>Subtotal</span><span className="font-semibold">{formatMoney(sale.subtotal, currency)}</span></div>
                <div className="flex justify-between"><span>Diskon</span><span>{formatMoney(sale.discount, currency)}</span></div>
                <div className="flex justify-between"><span>Pajak</span><span>{formatMoney(sale.tax, currency)}</span></div>
                {Math.abs(sale.rounding_adjustment||0) > 0 && (
                  <div className="flex justify-between">
                    <span>Pembulatan{sale.rounding_mode ? ` (${sale.rounding_mode})` : ''}</span>
                    <span className={ (sale.rounding_adjustment||0) < 0 ? 'text-green-600' : 'text-red-600' }>
                      {formatMoney(sale.rounding_adjustment, currency)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold"><span>Total</span><span>{formatMoney(sale.grand_total, currency)}</span></div>
                <div className="flex justify-between"><span>Dibayar</span><span>{formatMoney(sale.paid_amount, currency)}</span></div>
                <div className="flex justify-between"><span>Kembali</span><span>{formatMoney(sale.change_amount, currency)}</span></div>
              </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle>Pembayaran</CardTitle>
            <CardDescription>Metode dan nominal pembayaran</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metode</TableHead>
                  <TableHead>Referensi</TableHead>
                  <TableHead className="text-right">Nominal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sale.payments.map((p,i)=> (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{p.method?.toUpperCase()}</TableCell>
                    <TableCell>{p.reference || '-'}</TableCell>
                    <TableCell className="text-right">{formatMoney(p.amount, currency)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle>Item</CardTitle>
          <CardDescription>Daftar item pada transaksi</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produk</TableHead>
                <TableHead className="text-center">Qty</TableHead>
                <TableHead className="text-right">Harga</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sale.items.map(it => (
                <TableRow key={it.id}>
                  <TableCell className="font-medium">{it.product_name}</TableCell>
                  <TableCell className="text-center">{it.qty}</TableCell>
                  <TableCell className="text-right">{formatMoney(it.unit_price, currency)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatMoney(it.subtotal, currency)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
