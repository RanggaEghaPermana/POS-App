import { Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { apiGet } from '../api'
import { useEffect, useState } from 'react'
import { formatMoney } from '../utils/currency'
import { formatDateIndonesia } from '../utils/formatters'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import {
  Printer, CheckCircle, AlertCircle, Settings, Home
} from 'lucide-react'

export default function PrinterTest(){
  const { logout, token } = useAuth()
  // Hydrate from cache for instant render
  const cached = (()=>{
    try{ return window.__APP_SETTINGS__ || JSON.parse(localStorage.getItem('app_settings_cache')||'{}').value || null }catch{return null}
  })()
  const [currency, setCurrency] = useState(cached?.currency || 'IDR')
  const [storeData, setStoreData] = useState(cached)
  const [fxInfo, setFxInfo] = useState(()=>{
    const fx = cached?.fx
    return fx && fx.enabled && fx.rate>0 && fx.target ? { target: fx.target, rate: Number(fx.rate) } : null
  })
  const [loading, setLoading] = useState(!cached)

  useEffect(()=>{
    (async()=>{
      try{
        const config = await apiGet('/config', token)
        setCurrency(config.currency||'IDR')

        // Load store settings
        const settings = await apiGet('/settings', token)
        setStoreData(settings)
        // Prepare FX info from settings (test print uses current settings, not snapshot)
        const fx = settings?.fx || {}
        if (fx.enabled && fx.rate > 0 && fx.target) {
          setFxInfo({ target: fx.target, rate: Number(fx.rate) })
        } else {
          setFxInfo(null)
        }
      }catch{} finally { setLoading(false) }
    })()
  },[token])

  // Update preview instan setelah Pengaturan disimpan
  useEffect(()=>{
    function onUpdated(e){
      const s = e?.detail
      if (s) {
        setStoreData(s)
        if (s.currency) setCurrency(s.currency)
      }
    }
    window.addEventListener('app:settings-updated', onUpdated)
    return () => window.removeEventListener('app:settings-updated', onUpdated)
  },[])

  function print(){
    const printContent = document.getElementById('receipt-preview')
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>Test Print</title>
          <style>
            body { font-family: monospace; margin: 0; padding: 20px; }
            .receipt { width: 280px; margin: 0 auto; }
            .center { text-align: center; }
            .right { text-align: right; }
            hr { border: none; border-top: 1px dashed #000; margin: 8px 0; }
            table { width: 100%; border-collapse: collapse; }
            td { padding: 2px 0; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 px-8 py-12 text-white">
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-white/10 p-3">
                <Printer className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Uji Printer</h1>
                <p className="text-purple-100">Test koneksi dan kualitas printer</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="secondary" size="lg" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
              <Link to="/settings/store" className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Pengaturan
              </Link>
            </Button>
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
        {/* Receipt Preview */}
        <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5 text-purple-600" />
              Preview Struk Test
            </CardTitle>
            <CardDescription>
              Contoh struk yang akan dicetak untuk menguji printer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <div id="receipt-preview" className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm max-w-xs">
                {loading && !storeData && (
                  <div className="p-6 text-center text-gray-500">Memuat pengaturan...</div>
                )}
                <div className="receipt font-mono text-sm">
                  {storeData?.store?.logo_url && (
                    <div className="center mb-2">
                      <img src={storeData.store.logo_url} alt="Logo" style={{width: '60px', height: '60px', objectFit: 'contain', margin: '0 auto'}} />
                    </div>
                  )}
                  <div className="center font-bold text-lg">{storeData?.store?.name || 'FOTO COPY STORE'}</div>
                  <div className="center text-sm">{storeData?.store?.address || 'Jalan Mawar No. 1'}</div>
                  <div className="center text-sm">Telp: {storeData?.store?.phone || '(021) 123-4567'}</div>
                  {storeData?.store?.email && (
                    <div className="center text-sm">Email: {storeData.store.email}</div>
                  )}
                  {storeData?.store?.npwp && (
                    <div className="center text-sm">NPWP: {storeData.store.npwp}</div>
                  )}
                  <hr />

                  <div className="flex justify-between">
                    <span>No:</span>
                    <span>TEST-PRINT-{new Date().getTime()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tanggal:</span>
                    <span>{formatDateIndonesia(new Date())}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kasir:</span>
                    <span>Test User</span>
                  </div>

                  <hr />

                  <table className="w-full">
                    <tbody>
                      <tr>
                        <td>Fotocopy A4</td>
                        <td className="right">2 x {formatMoney(500, currency)}</td>
                      </tr>
                      <tr>
                        <td>Print Warna</td>
                        <td className="right">1 x {formatMoney(2000, currency)}</td>
                      </tr>
                      <tr>
                        <td>Jilid Spiral</td>
                        <td className="right">1 x {formatMoney(5000, currency)}</td>
                      </tr>
                    </tbody>
                  </table>

                  <hr />

                  <div className="flex justify-between"><span>Subtotal:</span><span>{formatMoney(8000, currency)}</span></div>
                  {storeData?.tax?.enabled && (
                    <div className="flex justify-between">
                      <span>PPN ({storeData.tax.rate || 11}%):</span>
                      <span>{formatMoney(8000 * (storeData.tax.rate || 11) / 100, currency)}</span>
                    </div>
                  )}

                  {(() => {
                    const policy = storeData?.pricing?.rounding || 'none'
                    const mode = storeData?.pricing?.rounding_mode || 'normal'
                    const rawTotal = storeData?.tax?.enabled ? 8000 * (1 + (storeData.tax.rate || 11) / 100) : 8000
                    let rounded = rawTotal
                    let adj = 0
                    if (policy !== 'none') {
                      const step = policy === 'nearest_1000' ? 1000 : (policy === 'nearest_100' ? 100 : null)
                      if (step) {
                        if (mode === 'discount') {
                          rounded = Math.floor(rawTotal / step) * step
                        } else {
                          rounded = Math.round(rawTotal / step) * step
                        }
                        adj = rounded - rawTotal
                      }
                    }
                    return (
                      <>
                        {adj !== 0 && (
                          <div className="flex justify-between">
                            <span>Pembulatan{mode ? ` (${mode})` : ''}:</span>
                            <span>{formatMoney(adj, currency)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold">
                          <span>TOTAL:</span>
                          <span>{formatMoney(rounded, currency)}</span>
                        </div>

                        {fxInfo && (
                          <div className="center text-xs text-gray-600 mt-1">
                            {`≈ ${new Intl.NumberFormat('en-US', { style:'currency', currency: fxInfo.target }).format(rounded * fxInfo.rate)} @ ${fxInfo.rate} ${fxInfo.target}/${currency}`}
                          </div>
                        )}

                        <hr />

                        {(() => {
                          const bayar = 10000
                          const kembali = bayar - rounded
                          return (
                            <>
                              <div className="flex justify-between"><span>Bayar:</span><span>{formatMoney(bayar, currency)}</span></div>
                              <div className="flex justify-between"><span>Kembali:</span><span>{formatMoney(kembali, currency)}</span></div>
                            </>
                          )
                        })()}
                      </>
                    )
                  })()}

                  <hr />

                  {storeData?.receipt?.footer ? (
                    <div className="center text-sm mt-2">
                      {storeData.receipt.footer.split('\n').map((line, i) => (
                        <div key={i}>{line}</div>
                      ))}
                    </div>
                  ) : (
                    <div className="center text-sm mt-2">
                      <div>Terima kasih atas kunjungan Anda</div>
                      <div>Barang yang sudah dibeli</div>
                      <div>tidak dapat dikembalikan</div>
                    </div>
                  )}

                  <div className="center text-xs mt-2">
                    <div>*** TEST PRINT ***</div>
                    <div>Struk ini hanya untuk uji coba</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Print Controls & Info */}
        <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5 text-purple-600" />
              Kontrol Cetak
            </CardTitle>
            <CardDescription>
              Uji fungsi printer dan kualitas cetakan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Print Button */}
            <div className="text-center">
              <Button
                onClick={print}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <Printer className="h-5 w-5 mr-2" />
                Cetak Struk Test
              </Button>
            </div>

            {/* Test Results */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Checklist Uji Printer</h4>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="font-medium text-gray-900">Koneksi Printer</div>
                    <div className="text-sm text-gray-500">Periksa apakah printer terhubung</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <div>
                    <div className="font-medium text-gray-900">Kualitas Cetakan</div>
                    <div className="text-sm text-gray-500">Pastikan teks terbaca dengan jelas</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <div>
                    <div className="font-medium text-gray-900">Pemotongan Kertas</div>
                    <div className="text-sm text-gray-500">Cek apakah kertas terpotong dengan baik</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <div>
                    <div className="font-medium text-gray-900">Format Layout</div>
                    <div className="text-sm text-gray-500">Verifikasi layout struk sesuai desain</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Printer Info */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-semibold text-purple-800 mb-2">Tips Penggunaan</h4>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• Pastikan printer thermal sudah terpasang dengan benar</li>
                <li>• Gunakan kertas thermal berukuran 58mm atau 80mm</li>
                <li>• Periksa level tinta atau ribbon printer</li>
                <li>• Pastikan driver printer sudah terinstall</li>
                <li>• Test cetak secara berkala untuk memastikan kualitas</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
