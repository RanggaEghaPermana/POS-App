import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { apiGet } from '../api'
import { formatMoney } from '../utils/currency'
import useCurrency from '../hooks/useCurrency'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { CreditCard, Eye, RefreshCcw } from 'lucide-react'

function money(n){ return new Intl.NumberFormat('id-ID').format(n||0) }

export default function Payables(){
  const { token } = useAuth()
  const currency = useCurrency('IDR')
  const [list, setList] = useState({ data:[], total:0 })
  const [loading, setLoading] = useState(false)

  async function load(page=1){
    setLoading(true)
    try{
      const res = await apiGet(`/payables?page=${page}&per_page=20`, token)
      setList(res || { data:[], total:0 })
    }catch(e){
      setList({ data:[], total:0 })
    }finally{ setLoading(false) }
  }
  useEffect(()=>{ (async()=>{ load() })() },[])

  const statusBadge = (s) => s==='paid'
    ? <Badge className="bg-green-100 text-green-800 border-green-300">Lunas</Badge>
    : (s==='partial'
      ? <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Sebagian</Badge>
      : <Badge variant="destructive">Belum Dibayar</Badge>)

  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-slate-600" />
            Hutang (Payables)
          </CardTitle>
          <CardDescription>Daftar invoice supplier dan status pembayaran</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-4">
            <div>{list.total || list.data?.length || 0} data</div>
            <Button size="sm" onClick={()=>load()} disabled={loading}><RefreshCcw className="h-4 w-4 mr-2"/>Muat Ulang</Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Dibayar</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(list.data||[]).map(row => (
                  <TableRow key={row.id}>
                    <TableCell className="font-semibold">{row.number}</TableCell>
                    <TableCell>{row.supplier?.name || '-'}</TableCell>
                    <TableCell>{row.date ? new Date(row.date).toLocaleDateString('id-ID') : '-'}</TableCell>
                    <TableCell className="text-right">{formatMoney(row.total, currency)}</TableCell>
                    <TableCell className="text-right">{formatMoney(row.paid_total||0, currency)}</TableCell>
                    <TableCell>{statusBadge(row.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
