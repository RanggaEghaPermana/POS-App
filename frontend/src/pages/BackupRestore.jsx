import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { apiGet } from '../api'
import { formatDateIndonesia } from '../utils/formatters'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import {
  Database, Download, Plus, Shield, Clock, FileArchive,
  Home, HardDrive, AlertTriangle, CheckCircle
} from 'lucide-react'

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default function BackupRestore(){
  const { token, logout } = useAuth()
  const [list, setList] = useState({ data:[], meta:{} })
  const [creating, setCreating] = useState(false)

  async function load(page=1){ setList(await apiGet(`/backups?page=${page}`, token)) }
  async function create(){
    setCreating(true)
    try{
      const base = import.meta.env.VITE_API_BASE || 'http://localhost/api/v1'
      const res = await fetch(`${base}/backups`, { method:'POST', headers:{ Authorization:`Bearer ${token}` } })
      if(!res.ok){ const d=await res.json().catch(()=>({})); throw new Error(d.message||'Gagal membuat backup') }
      load()
    }catch(e){ alert(e.message) } finally { setCreating(false) }
  }
  function download(id){
    const base = import.meta.env.VITE_API_BASE || 'http://localhost/api/v1'
    window.open(`${base}/backups/${id}/download?token=${token}`, '_blank')
  }
  useEffect(()=>{ load() },[])

  const pagination=[]; const current=list.current_page||1; const last=list.last_page||1; for(let i=1;i<=last;i++){ pagination.push(i) }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 px-8 py-12 text-white">
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-white/10 p-3">
                <Database className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Backup & Restore</h1>
                <p className="text-indigo-100">Kelola cadangan data sistem</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
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

      {/* Create Backup Section */}
      <Card className="shadow-lg border-0 bg-gradient-to-r from-indigo-50 to-blue-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-indigo-100 p-3">
                <Shield className="h-8 w-8 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Buat Backup Baru</h3>
                <p className="text-gray-600">Buat cadangan lengkap data sistem Anda</p>
              </div>
            </div>
            <Button
              onClick={create}
              disabled={creating}
              size="lg"
              className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all min-w-[160px]"
            >
              {creating ? (
                <>
                  <Database className="h-5 w-5 mr-2 animate-spin" />
                  Membuat...
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5 mr-2" />
                  Buat Backup
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Backup List */}
      <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileArchive className="h-5 w-5 text-indigo-600" />
            Daftar Backup ({list.data?.length || 0})
          </CardTitle>
          <CardDescription>
            File backup yang tersedia untuk diunduh atau direstore
          </CardDescription>
        </CardHeader>
        <CardContent>
          {list.data?.length === 0 ? (
            <div className="text-center py-16">
              <div className="rounded-full bg-gray-100 p-6 mx-auto mb-4 w-fit">
                <Database className="h-16 w-16 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Backup</h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                Belum ada file backup yang tersedia. Buat backup pertama untuk melindungi data Anda.
              </p>
              <Button
                onClick={create}
                disabled={creating}
                className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700"
              >
                <Plus className="h-5 w-5 mr-2" />
                Buat Backup Pertama
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {list.data?.map((b, index) => (
                <div key={b.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                      #{index + 1}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="font-semibold text-gray-900 truncate">{b.filename}</div>
                      <Badge className="bg-green-100 text-green-800 border-green-300">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Siap
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <HardDrive className="h-4 w-4" />
                        <span>{formatFileSize(b.size)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatDateIndonesia(b.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    <Button
                      onClick={() => download(b.id)}
                      variant="outline"
                      size="sm"
                      className="hover:bg-indigo-50 hover:border-indigo-300"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.length > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6 pt-6 border-t">
              {pagination.map(p => (
                <Button
                  key={p}
                  onClick={() => load(p)}
                  disabled={p === current}
                  variant={p === current ? "default" : "outline"}
                  size="sm"
                  className={p === current ? "bg-indigo-600 hover:bg-indigo-700" : "hover:bg-indigo-50"}
                >
                  {p}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Important Information */}
      <Card className="shadow-lg border-0 bg-gradient-to-r from-yellow-50 to-orange-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-yellow-800 mb-2">Informasi Penting</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• File backup berisi seluruh data sistem termasuk produk, transaksi, dan pengaturan</li>
                <li>• Simpan file backup di lokasi yang aman dan terpisah dari server utama</li>
                <li>• Lakukan backup secara rutin untuk melindungi data dari kehilangan</li>
                <li>• File backup dapat digunakan untuk memulihkan sistem jika terjadi masalah</li>
                <li>• Proses backup mungkin membutuhkan waktu tergantung ukuran data</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}