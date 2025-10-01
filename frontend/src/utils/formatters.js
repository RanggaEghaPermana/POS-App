// Utility functions untuk format Indonesia

/**
 * Format tanggal ke format Indonesia (DD/MM/YYYY HH:mm)
 */
export function formatDateIndonesia(dateString) {
  if (!dateString) return '-'

  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '-'

  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')

  return `${day}/${month}/${year} ${hours}:${minutes}`
}

/**
 * Format tanggal saja ke format Indonesia (DD/MM/YYYY)
 */
export function formatDateOnly(dateString) {
  if (!dateString) return '-'

  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '-'

  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()

  return `${day}/${month}/${year}`
}

/**
 * Format waktu saja ke format Indonesia (HH:mm)
 */
export function formatTimeOnly(dateString) {
  if (!dateString) return '-'

  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '-'

  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')

  return `${hours}:${minutes}`
}

/**
 * Format rupiah dengan ribuan
 */
export function formatRupiah(amount) {
  if (amount === null || amount === undefined || amount === '') return 'Rp 0'

  const number = typeof amount === 'string' ? parseFloat(amount.replace(/[^\d.-]/g, '')) : Number(amount)
  if (isNaN(number)) return 'Rp 0'

  return 'Rp ' + number.toLocaleString('id-ID')
}

/**
 * Parse rupiah string ke number
 */
export function parseRupiah(rupiahString) {
  if (!rupiahString) return 0

  // Remove 'Rp', spaces, and dots (thousand separators), keep only numbers and comma
  const cleaned = rupiahString.toString().replace(/[Rp\s.]/g, '').replace(',', '.')
  const number = parseFloat(cleaned)

  return isNaN(number) ? 0 : number
}

/**
 * Format number input dengan ribuan otomatis (untuk input field)
 */
export function formatNumberInput(value) {
  if (!value) return ''

  // Remove non-numeric characters except comma/dot
  const cleaned = value.toString().replace(/[^\d,.-]/g, '')
  const number = parseFloat(cleaned.replace(',', '.'))

  if (isNaN(number)) return ''

  return number.toLocaleString('id-ID')
}

/**
 * Format datetime-local untuk input field (YYYY-MM-DDTHH:mm)
 */
export function formatDateTimeLocal(dateString) {
  if (!dateString) return ''

  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ''

  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

/**
 * Parse datetime-local value ke ISO string
 */
export function parseDateTimeLocal(value) {
  if (!value) return null

  const date = new Date(value)
  return isNaN(date.getTime()) ? null : date.toISOString()
}