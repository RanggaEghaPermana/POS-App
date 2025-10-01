import { useState, useEffect } from 'react'
import { Input } from './input'
import { formatNumberInput, parseRupiah } from '../../utils/formatters'

export function RupiahInput({
  value,
  onChange,
  placeholder = "Masukkan nominal...",
  className = "",
  ...props
}) {
  const [displayValue, setDisplayValue] = useState('')

  // Update display value ketika value prop berubah
  useEffect(() => {
    if (value !== undefined && value !== null) {
      const numValue = typeof value === 'string' ? parseRupiah(value) : Number(value)
      setDisplayValue(numValue === 0 ? '' : formatNumberInput(numValue))
    }
  }, [value])

  const handleChange = (e) => {
    const inputValue = e.target.value

    // Allow empty input
    if (inputValue === '') {
      setDisplayValue('')
      onChange && onChange(0)
      return
    }

    // Remove all non-numeric characters
    const numericOnly = inputValue.replace(/[^\d]/g, '')

    if (numericOnly === '') {
      setDisplayValue('')
      onChange && onChange(0)
      return
    }

    const numericValue = parseInt(numericOnly, 10)
    const formatted = formatNumberInput(numericValue)

    setDisplayValue(formatted)
    onChange && onChange(numericValue)
  }

  const handleFocus = (e) => {
    // Select all text when focused for easy editing
    e.target.select()
  }

  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">
        Rp
      </div>
      <Input
        {...props}
        type="text"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        placeholder={placeholder}
        className={`pl-10 ${className}`}
      />
    </div>
  )
}