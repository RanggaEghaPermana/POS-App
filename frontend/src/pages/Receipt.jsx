import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { apiGet } from '../api'
import { useAuth } from '../AuthContext'
import { formatDateIndonesia } from '../utils/formatters'

function formatMoney(n, cfg){
  const currency = cfg?.currency || 'IDR'
  const locale = currency === 'IDR' ? 'id-ID' : 'en-US'
  try{
    return new Intl.NumberFormat(locale, { style:'currency', currency, minimumFractionDigits:0 }).format(n||0)
  }catch{
    // Fallback to plain grouping
    return (currency === 'IDR' ? 'Rp ' : '') + new Intl.NumberFormat(locale).format(n||0)
  }
}

export default function Receipt(){
  const { id } = useParams()
  const { token } = useAuth()
  const [sale, setSale] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cfg, setCfg] = useState(null)
  const [creating, setCreating] = useState(false)

  useEffect(()=>{
    (async()=>{
      const isMockMode = import.meta.env.VITE_MOCK_BARBERSHOP === "true" || true

      if (isMockMode || !token) {
        // Handle mock mode - load from localStorage
        try {
          const mockSales = JSON.parse(localStorage.getItem('barbershop_sales') || '[]')
          const mockSale = mockSales.find(sale => sale.id === id)

          if (mockSale) {
            setSale(mockSale)
            // Get config from settings if available
            let config = {
              business_name: 'Barbershop Professional',
              address: 'Jl. Cukur Rambut No. 123',
              phone: '(021) 123-4567',
              currency: 'IDR'
            }

            try {
              const savedSettings = localStorage.getItem('barbershop_settings')
              if (savedSettings) {
                const settings = JSON.parse(savedSettings)
                config = {
                  business_name: settings.store?.name || config.business_name,
                  address: settings.store?.address || config.address,
                  phone: settings.store?.phone || config.phone,
                  currency: settings.currency || config.currency
                }
              }
            } catch {}

            setCfg(config)
          } else {
            alert('Data struk tidak ditemukan')
          }
        } catch (e) {
          console.warn('Error loading mock receipt:', e)
          alert('Tidak dapat memuat data struk')
        }
        setLoading(false)
        return
      }

      // API mode
      try{
        const [c, s] = await Promise.all([
          apiGet('/config', token),
          apiGet(`/sales/${id}`, token)
        ])
        setCfg(c)
        setSale(s)
      }catch(e){
        console.warn('API not available, trying mock mode:', e.message)
        // Fallback to mock mode
        try {
          const mockSales = JSON.parse(localStorage.getItem('barbershop_sales') || '[]')
          const mockSale = mockSales.find(sale => sale.id === id)

          if (mockSale) {
            setSale(mockSale)
            // Get config from settings for fallback mode too
            let config = {
              business_name: 'Barbershop Professional',
              address: 'Jl. Cukur Rambut No. 123',
              phone: '(021) 123-4567',
              currency: 'IDR'
            }

            try {
              const savedSettings = localStorage.getItem('barbershop_settings')
              if (savedSettings) {
                const settings = JSON.parse(savedSettings)
                config = {
                  business_name: settings.store?.name || config.business_name,
                  address: settings.store?.address || config.address,
                  phone: settings.store?.phone || config.phone,
                  currency: settings.currency || config.currency
                }
              }
            } catch {}

            setCfg(config)
          } else {
            alert('Data struk tidak ditemukan')
          }
        } catch (mockError) {
          alert('Tidak dapat memuat data struk')
        }
      } finally {
        setLoading(false)
      }
    })()
  },[id, token])

  // Ikuti perubahan pengaturan tanpa reload
  useEffect(()=>{
    function onConfigUpdated(e){ if (e?.detail) setCfg(e.detail) }
    function onSettingsUpdated(e){
      const s = e?.detail
      if (s) setCfg(prev => ({ ...(prev||{}), ...s }))
      else if (window.__APP_CONFIG__) setCfg(window.__APP_CONFIG__)
    }
    window.addEventListener('app:config-updated', onConfigUpdated)
    window.addEventListener('app:settings-updated', onSettingsUpdated)
    return () => {
      window.removeEventListener('app:config-updated', onConfigUpdated)
      window.removeEventListener('app:settings-updated', onSettingsUpdated)
    }
  },[])

  if (loading) return <div style={{padding:16}}>Memuat...</div>
  if (!sale) return <div style={{padding:16}}>Data tidak ditemukan</div>

  const store = cfg?.store || {}
  const footer = (cfg?.receipt?.footer || '').split('\n').filter(Boolean)

  const fxRate = sale.fx_rate_used || cfg?.fx?.rate
  const fxTarget = sale.fx_target || cfg?.fx?.target
  const fxEnabled = !!(cfg?.fx?.enabled) || (sale.fx_rate_used && sale.fx_target)
  const fxTime = sale.fx_timestamp

  return (
    <div style={{padding:16, fontFamily:'monospace', fontSize:14, lineHeight:1.4, maxWidth:280, margin:'0 auto'}}>
      {/* Header: Store info */}
      <div style={{textAlign:'center', marginBottom:16}}>
        <div style={{fontWeight:'bold', fontSize:16}}>{cfg?.business_name || 'Barbershop Professional'}</div>
        <div style={{fontSize:12}}>{cfg?.address || 'Jl. Cukur Rambut No. 123'}</div>
        <div style={{fontSize:12}}>Telp: {cfg?.phone || '(021) 123-4567'}</div>
      </div>

      {/* Transaction Info */}
      <div style={{marginBottom:12}}>
        <div>No:</div>
        <div style={{fontWeight:'bold', marginBottom:8}}>{sale.number}</div>
        <div>Tanggal:</div>
        <div style={{marginBottom:8}}>
          {new Date(sale.date || sale.created_at).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })} {new Date(sale.date || sale.created_at).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
        {sale.customer_name && (
          <>
            <div>Pelanggan:</div>
            <div style={{marginBottom:8}}>{sale.customer_name}</div>
          </>
        )}
        {sale.barber_name && (
          <>
            <div>Barber:</div>
            <div style={{marginBottom:8}}>{sale.barber_name}</div>
          </>
        )}
      </div>

      {/* Items */}
      <div style={{marginBottom:12}}>
        {(sale.items || sale.service_items || []).map((it, i) => (
          <div key={it.id || i} style={{marginBottom:4}}>
            <div>{it.name || it.product_name || 'Layanan Barbershop'}</div>
            <div style={{display:'flex', justifyContent:'space-between'}}>
              <span>{it.qty || it.quantity || 1} x {formatMoney(it.unit_price, cfg)}</span>
              <span>{formatMoney((it.qty || it.quantity || 1) * it.unit_price, cfg)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div style={{borderTop:'1px dashed #000', paddingTop:8, marginBottom:12}}>
        <div style={{display:'flex', justifyContent:'space-between'}}>
          <span>Subtotal:</span>
          <span>{formatMoney(sale.subtotal, cfg)}</span>
        </div>
        {sale.discount > 0 && (
          <div style={{display:'flex', justifyContent:'space-between'}}>
            <span>Diskon:</span>
            <span>-{formatMoney(sale.discount, cfg)}</span>
          </div>
        )}
        {sale.tax > 0 && (
          <div style={{display:'flex', justifyContent:'space-between'}}>
            <span>Pajak:</span>
            <span>{formatMoney(sale.tax, cfg)}</span>
          </div>
        )}
        <div style={{display:'flex', justifyContent:'space-between', fontWeight:'bold', fontSize:16, marginTop:4}}>
          <span>TOTAL:</span>
          <span>{formatMoney(sale.grand_total, cfg)}</span>
        </div>
        <div style={{display:'flex', justifyContent:'space-between', marginTop:4}}>
          <span>Bayar:</span>
          <span>{formatMoney(sale.paid_amount, cfg)}</span>
        </div>
        <div style={{display:'flex', justifyContent:'space-between'}}>
          <span>Kembali:</span>
          <span>{formatMoney(sale.change_amount, cfg)}</span>
        </div>
      </div>

      {/* Footer */}
      <div style={{textAlign:'center', fontSize:12, marginTop:16}}>
        <div>Terima kasih atas kunjungan Anda</div>
        <div>Pelayanan yang sudah diberikan</div>
        <div>tidak dapat dikembalikan</div>
        <div style={{marginTop:8}}>*** STRUK BARBERSHOP ***</div>
      </div>

      {/* Action buttons */}
      <div style={{marginTop:20, textAlign:'center'}}>
        <button
          onClick={()=>window.print()}
          style={{padding:'8px 16px', marginRight:8, fontSize:14}}
        >
          Cetak
        </button>
        <Link
          to="/service-pos"
          style={{padding:'8px 16px', textDecoration:'none', backgroundColor:'#f3f4f6', border:'1px solid #d1d5db', borderRadius:'4px', fontSize:14}}
        >
          Transaksi Baru
        </Link>
      </div>
    </div>
  )
}
