import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { BUSINESS_TYPES, BUSINESS_NAVIGATION } from '../utils/businessNavigation'
import { apiPost, apiGet } from '../api'
import { useAuth } from '../AuthContext'

export default function BusinessTypeSelector({ onBusinessTypeSelected, currentBusinessType = null }) {
  const { token } = useAuth()
  const [selectedType, setSelectedType] = useState(currentBusinessType)
  const [isLoading, setIsLoading] = useState(false)
  const [businessConfig, setBusinessConfig] = useState(null)

  // Load current business config
  useEffect(() => {
    loadBusinessConfig()
  }, [token])

  async function loadBusinessConfig() {
    try {
      const config = await apiGet('/config', token)
      if (config?.business_type) {
        setSelectedType(config.business_type)
        setBusinessConfig(config)
      }
    } catch (error) {
      console.error('Failed to load business config:', error)
    }
  }

  async function handleBusinessTypeSelect(businessType) {
    setIsLoading(true)
    try {
      // Update business type in backend
      await apiPost('/settings/business-type', { business_type: businessType }, token)

      setSelectedType(businessType)

      // Trigger global config update
      window.dispatchEvent(new CustomEvent('app:settings-updated'))

      if (onBusinessTypeSelected) {
        onBusinessTypeSelected(businessType)
      }
    } catch (error) {
      console.error('Failed to update business type:', error)
    }
    setIsLoading(false)
  }

  const businessTypes = Object.entries(BUSINESS_NAVIGATION).map(([key, config]) => ({
    key,
    ...config
  }))

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Pilih Jenis Bisnis Anda</h1>
        <p className="text-muted-foreground">
          Sesuaikan tampilan dan fitur aplikasi dengan jenis bisnis Anda
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {businessTypes.map((business) => {
          const IconComponent = business.icon
          const isSelected = selectedType === business.key

          return (
            <Card
              key={business.key}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                isSelected ? 'ring-2 ring-primary shadow-lg' : ''
              }`}
              onClick={() => handleBusinessTypeSelect(business.key)}
            >
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <IconComponent
                    className="h-8 w-8"
                    style={{ color: business.primaryColor }}
                  />
                </div>
                <CardTitle className="flex items-center justify-center gap-2">
                  {business.name}
                  {isSelected && (
                    <Badge variant="default">Aktif</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center mb-4">
                  {getBusinessDescription(business.key)}
                </CardDescription>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Fitur Utama:</div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {getBusinessFeatures(business.key).map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-primary rounded-full" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {isSelected && (
                  <Button className="w-full mt-4" disabled>
                    Sedang Digunakan
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {selectedType && (
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Pengaturan telah disimpan. Sidebar dan menu akan disesuaikan dengan jenis bisnis yang dipilih.
          </p>
        </div>
      )}
    </div>
  )
}

function getBusinessDescription(businessType) {
  const descriptions = {
    [BUSINESS_TYPES.PHOTOCOPY]: 'Foto copy, printing, dan layanan percetakan',
    [BUSINESS_TYPES.BARBERSHOP]: 'Salon cukur rambut dan perawatan',
    [BUSINESS_TYPES.RESTAURANT]: 'Restoran, cafe, dan layanan makanan',
    [BUSINESS_TYPES.RETAIL]: 'Toko retail dan penjualan barang',
    [BUSINESS_TYPES.LAUNDRY]: 'Layanan cuci dan setrika',
    [BUSINESS_TYPES.AUTOMOTIVE]: 'Service kendaraan dan bengkel',
    [BUSINESS_TYPES.PHARMACY]: 'Apotek dan farmasi',
    [BUSINESS_TYPES.CLINIC]: 'Klinik kesehatan dan pelayanan medis',
    [BUSINESS_TYPES.HOSPITAL]: 'Rumah sakit dan manajemen pasien',
    [BUSINESS_TYPES.EDUCATION]: 'Lembaga pendidikan dan kursus',
    [BUSINESS_TYPES.LEGAL]: 'Firma hukum dan layanan legal',
    [BUSINESS_TYPES.CONSULTING]: 'Konsultan bisnis dan profesional',
    [BUSINESS_TYPES.ELECTRONICS]: 'Toko elektronik dan service center',
    [BUSINESS_TYPES.GENERAL]: 'Bisnis umum dan serbaguna'
  }

  return descriptions[businessType] || 'Bisnis umum'
}

function getBusinessFeatures(businessType) {
  const features = {
    [BUSINESS_TYPES.PHOTOCOPY]: [
      'Kasir print & photocopy',
      'Manajemen antrian print',
      'Layanan design grafis',
      'Large format printing',
      'Finishing & binding',
      'Upload file online'
    ],
    [BUSINESS_TYPES.BARBERSHOP]: [
      'Booking appointment',
      'Paket layanan cukur',
      'Jadwal staff barber',
      'Customer membership'
    ],
    [BUSINESS_TYPES.RESTAURANT]: [
      'Menu management',
      'Table ordering',
      'Kitchen display',
      'Special packages'
    ],
    [BUSINESS_TYPES.RETAIL]: [
      'Katalog produk lengkap',
      'Barcode & inventory tracking',
      'Program loyalty customer',
      'Multi payment gateway',
      'Promo & discount system',
      'Sales analytics'
    ],
    [BUSINESS_TYPES.LAUNDRY]: [
      'Paket cuci lengkap',
      'Perhitungan berat otomatis',
      'Express service 3 jam',
      'Pickup & delivery tracking',
      'Perawatan kain khusus',
      'Notifikasi WhatsApp'
    ],
    [BUSINESS_TYPES.PHARMACY]: [
      'Stok obat & alert expire',
      'Resep digital & tracking',
      'Konsultasi farmasis',
      'BPJS & insurance claim',
      'Drug interaction check',
      'Vaccine management'
    ],
    [BUSINESS_TYPES.CLINIC]: [
      'Registrasi pasien',
      'Appointment system',
      'Rekam medis',
      'Billing & farmasi'
    ],
    [BUSINESS_TYPES.HOSPITAL]: [
      'Admisi pasien',
      'Manajemen kamar',
      'Departemen medis',
      'Medical supplies'
    ],
    [BUSINESS_TYPES.EDUCATION]: [
      'Pendaftaran siswa',
      'Jadwal pelajaran',
      'Pembayaran SPP',
      'Data pengajar'
    ],
    [BUSINESS_TYPES.LEGAL]: [
      'Manajemen kasus',
      'Data klien',
      'Fee & retainer',
      'Schedule appointment'
    ],
    [BUSINESS_TYPES.CONSULTING]: [
      'Project management',
      'Client proposals',
      'Revenue billing',
      'Meeting scheduler'
    ],
    [BUSINESS_TYPES.ELECTRONICS]: [
      'Penjualan & trade-in',
      'Service center tracking',
      'Warranty management',
      'Serial number database',
      'Repair cost estimation',
      'Parts inventory'
    ],
    [BUSINESS_TYPES.GENERAL]: [
      'Flexible POS system',
      'Service & product sales',
      'Basic reporting',
      'Multi-business support'
    ]
  }

  return features[businessType] || [
    'Point of sale',
    'Inventory management',
    'Basic reporting',
    'User management'
  ]
}
