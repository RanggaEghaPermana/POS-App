export function formatMoney(n, currency) {
  const cur = currency || 'IDR'
  const locale = cur === 'IDR' ? 'id-ID' : 'en-US'
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: cur, minimumFractionDigits: 0 }).format(n || 0)
  } catch {
    return (cur === 'IDR' ? 'Rp ' : (cur + ' ')) + new Intl.NumberFormat(locale).format(n || 0)
  }
}

