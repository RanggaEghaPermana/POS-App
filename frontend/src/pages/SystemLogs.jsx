import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { apiGet } from '../api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import {
  FileText, RefreshCw, Terminal, Home, AlertTriangle,
  Info, Clock, Settings
} from 'lucide-react'

export default function SystemLogs(){
  const { token, logout } = useAuth()
  const [content, setContent] = useState('')
  const [lines, setLines] = useState(300)
  const [loading, setLoading] = useState(false)

  async function load(){
    setLoading(true)
    try {
      const res = await apiGet(`/logs/system?lines=${lines}`, token)
      setContent(res.content||'Tidak ada log yang tersedia.')
    } catch (error) {
      setContent('Error memuat log: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(()=>{ load() },[])

  const formatLogContent = (content) => {
    if (!content) return 'Tidak ada log yang tersedia.'

    return content.split('\n').map((line, index) => {
      let className = "block py-1 px-2 text-sm font-mono"

      // Color coding based on log level
      if (line.includes('[ERROR]') || line.includes('ERROR') || line.includes('error')) {
        className += " bg-red-900/20 text-red-300 border-l-2 border-red-500"
      } else if (line.includes('[WARN]') || line.includes('WARN') || line.includes('warning')) {
        className += " bg-yellow-900/20 text-yellow-300 border-l-2 border-yellow-500"
      } else if (line.includes('[INFO]') || line.includes('INFO')) {
        className += " bg-blue-900/20 text-blue-300 border-l-2 border-blue-500"
      } else if (line.includes('[DEBUG]') || line.includes('DEBUG')) {
        className += " bg-gray-700/20 text-gray-400"
      } else {
        className += " text-gray-300"
      }

      return (
        <div key={index} className={className}>
          {line || ' '}
        </div>
      )
    })
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-gray-800 via-slate-800 to-zinc-800 px-8 py-12 text-white">
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-white/10 p-3">
                <FileText className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Log Sistem</h1>
                <p className="text-gray-300">Monitor aktivitas dan error sistem</p>
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

      {/* Controls */}
      <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-600" />
            Pengaturan Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div>
              <Label htmlFor="lines">Jumlah Baris</Label>
              <Input
                id="lines"
                type="number"
                value={lines}
                onChange={e=>setLines(e.target.value)}
                className="w-32 h-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-gray-500 transition-all"
                min="10"
                max="1000"
              />
            </div>
            <Button
              onClick={load}
              disabled={loading}
              className="bg-gradient-to-r from-gray-600 to-slate-600 hover:from-gray-700 hover:to-slate-700"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Log Content */}
      <Card className="shadow-xl border-0 bg-slate-900 text-gray-100">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <Terminal className="h-5 w-5 text-green-400" />
              Terminal Log ({lines} baris terakhir)
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Clock className="h-4 w-4" />
              <span>Real-time system logs</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div
            className="bg-slate-950 p-4 max-h-[70vh] overflow-auto scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-600"
            style={{ fontFamily: 'JetBrains Mono, Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace' }}
          >
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-gray-400 mr-2" />
                <span className="text-gray-400">Memuat log sistem...</span>
              </div>
            ) : (
              <div className="space-y-0">
                {formatLogContent(content)}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Log Legend */}
      <Card className="shadow-lg border-0 bg-gradient-to-r from-gray-50 to-slate-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Info className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Legend Warna Log</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded border-l-2 border-red-600"></div>
                  <span className="text-sm text-gray-600">Error</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded border-l-2 border-yellow-600"></div>
                  <span className="text-sm text-gray-600">Warning</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded border-l-2 border-blue-600"></div>
                  <span className="text-sm text-gray-600">Info</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-500 rounded"></div>
                  <span className="text-sm text-gray-600">Debug/Other</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}