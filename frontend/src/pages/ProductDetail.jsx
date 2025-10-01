import { useEffect, useState } from 'react'
import { useAuth } from '../AuthContext'
import { apiGet } from '../api'
import { formatMoney } from '../utils/currency'
import useCurrency from '../hooks/useCurrency'
import { Link, useParams } from 'react-router-dom'
import { formatDateIndonesia } from '../utils/formatters'

function money(n){ return new Intl.NumberFormat('id-ID').format(n||0) }

export default function ProductDetail(){
  const { id } = useParams()
  const { token, logout } = useAuth()
  const currency = useCurrency('IDR')
  const [product, setProduct] = useState(null)
  const [barcodeUrl, setBarcodeUrl] = useState('')

  useEffect(()=>{ (async()=>{
    try{
      const p = await apiGet(`/admin/products/${id}`, token)
      setProduct(p)
    }catch(e){ alert(e.message) }
  })() },[id])

  useEffect(()=>{ (async()=>{
    try{
      const base = import.meta.env.VITE_API_BASE || 'http://localhost/api/v1'
      const res = await fetch(`${base}/admin/products/${id}/barcode`, { headers: { Authorization: `Bearer ${token}` } })
      const blob = await res.blob()
      setBarcodeUrl(URL.createObjectURL(blob))
    }catch{}
  })() },[id, token])

  if(!product) return <div style={{padding:16}}>Memuat...</div>

  return (
    <div style={{ padding:16, fontFamily:'system-ui' }}>
      <header style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h2>Detail Produk</h2>
        <div>
          <Link to="/inventory">Kembali</Link>
          <button style={{marginLeft:8}} onClick={logout}>Keluar</button>
        </div>
      </header>

      <div style={{border:'1px solid #e5e7eb', padding:12, borderRadius:8, marginTop:8}}>
        <div><strong>{product.name}</strong></div>
        <div>SKU: {product.sku}</div>
        <div>Kategori: {product.category?.name || '-'}</div>
        <div>Harga: {formatMoney(product.price, currency)}</div>
        <div>Stok: {product.stock}</div>
        <div>Status: {product.active ? 'Aktif' : 'Nonaktif'}</div>
        {barcodeUrl && <div style={{marginTop:8}}><img src={barcodeUrl} alt="barcode"/></div>}
      </div>

      <div style={{border:'1px solid #e5e7eb', padding:12, borderRadius:8, marginTop:8}}>
        <h3>Riwayat Harga</h3>
        <table style={{width:'100%'}}>
          <thead><tr><th style={{textAlign:'left'}}>Tanggal</th><th style={{textAlign:'right'}}>Dari</th><th style={{textAlign:'right'}}>Ke</th></tr></thead>
          <tbody>
            {product.price_histories?.length ? product.price_histories.map(h => (
              <tr key={h.id}>
                <td>{formatDateIndonesia(h.created_at)}</td>
                <td style={{textAlign:'right'}}>{h.old_price==null?'-':formatMoney(h.old_price, currency)}</td>
                <td style={{textAlign:'right'}}>{formatMoney(h.new_price, currency)}</td>
              </tr>
            )) : <tr><td colSpan={3}><em>Belum ada riwayat</em></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
