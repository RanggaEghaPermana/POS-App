import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { apiGet } from '../api'
import { useAuth } from '../AuthContext'
import { formatDateIndonesia } from '../utils/formatters'

function formatMoney(n, currency){
  const cur = currency || 'IDR'
  const locale = cur === 'IDR' ? 'id-ID' : 'en-US'
  try{ return new Intl.NumberFormat(locale, { style:'currency', currency:cur, minimumFractionDigits:0 }).format(n||0) }catch{ return (cur==='IDR'?'Rp ':'')+new Intl.NumberFormat(locale).format(n||0) }
}

export default function Invoice(){
  const { id } = useParams()
  const { token } = useAuth()
  const [inv, setInv] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    (async()=>{
      try{ setInv(await apiGet(`/invoices/${id}`, token)) }catch(e){ alert(e.message) } finally{ setLoading(false) }
    })()
  },[id, token])

  if (loading) return <div style={{padding:16}}>Memuat...</div>
  if (!inv) return <div style={{padding:16}}>Data tidak ditemukan</div>

  const store = inv.store || {}
  const sale = inv.sale || {}
  const currency = inv.currency || 'IDR'
  const fx = inv.fx || {}

  return (
    <div style={{padding:16, fontFamily:'system-ui'}}>
      <div style={{textAlign:'center', marginBottom:8}}>
        {store.logo_url && <img src={store.logo_url} alt="Logo" style={{height:48, objectFit:'contain', margin:'0 auto'}} />}
        <div style={{fontWeight:'bold', fontSize:18}}>{store.name || 'Toko'}</div>
        {store.address && <div style={{fontSize:12}}>{store.address}</div>}
        {(store.phone || store.email) && (
          <div style={{fontSize:12}}>
            {store.phone ? `Telp: ${store.phone}` : ''}
            {store.phone && store.email ? ' | ' : ''}
            {store.email ? store.email : ''}
          </div>
        )}
        {store.npwp && <div style={{fontSize:12}}>NPWP: {store.npwp}</div>}
        {store.nib && <div style={{fontSize:12}}>NIB: {store.nib}</div>}
      </div>

      <h2>Invoice #{inv.number}</h2>
      <div>Tanggal: {formatDateIndonesia(inv.date)}</div>
      <div>No. Transaksi: {sale.number}</div>
      <hr/>

      <table style={{width:'100%', marginTop:6}}>
        <thead><tr><th style={{textAlign:'left'}}>Item</th><th>Qty</th><th style={{textAlign:'right'}}>Harga</th><th style={{textAlign:'right'}}>Subtotal</th></tr></thead>
        <tbody>
          {(sale.items||[]).map((it,idx)=>
            <tr key={idx}>
              <td>{it.name}</td>
              <td style={{textAlign:'center'}}>{it.qty}</td>
              <td style={{textAlign:'right'}}>{formatMoney(it.unit_price, currency)}</td>
              <td style={{textAlign:'right'}}>{formatMoney(it.subtotal, currency)}</td>
            </tr>
          )}
        </tbody>
      </table>
      <hr/>
      <div style={{textAlign:'right'}}>
        <div>Subtotal: {formatMoney(sale.subtotal, currency)}</div>
        <div>Diskon: {formatMoney(sale.discount, currency)}</div>
        <div>Pajak: {formatMoney(sale.tax, currency)}</div>
        <div style={{fontWeight:'bold'}}>Total: {formatMoney(sale.grand_total, currency)}</div>
      </div>
      {fx?.enabled && fx?.rate > 0 && fx?.target && (
        <div style={{textAlign:'right', fontSize:12, color:'#555'}}>
          ≈ {new Intl.NumberFormat('en-US', { style:'currency', currency: fx.target }).format((sale.grand_total||0) * Number(fx.rate))}
          {' '}@ {fx.rate} {fx.target}/{currency}
        </div>
      )}
      <div style={{marginTop:8}}>
        <strong>Pembayaran:</strong>
        <ul>
          {(sale.payments||[]).map((p,i)=> (
            <li key={i}>{p.method?.toUpperCase()} - {formatMoney(p.amount, currency)} {p.reference ? `(${p.reference})` : ''}</li>
          ))}
        </ul>
      </div>
      <button onClick={()=>window.print()}>Cetak</button>
      <Link to="/" style={{marginLeft:8}}>Transaksi Baru</Link>
    </div>
  )
}

