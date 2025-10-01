import { useEffect, useLayoutEffect, useRef, useState } from 'react'

export default function AutoFitText({ children, text, minSize = 10, maxSize = 14, step = 1, className = '' }) {
  const spanRef = useRef(null)
  const [size, setSize] = useState(maxSize)
  const content = text ?? children

  function measureAndFit() {
    const el = spanRef.current
    if (!el) return
    const parent = el.parentElement
    if (!parent) return

    // Estimate available width inside the flex container (icon + gap + padding)
    const parentRect = parent.getBoundingClientRect()
    const svg = parent.querySelector('svg')
    const iconWidth = svg ? svg.getBoundingClientRect().width : 0
    const gap = 8 // Tailwind gap-2 ≈ 8px
    const padding = 12 // roughly account padding within button
    const available = Math.max(0, parentRect.width - iconWidth - gap - padding)

    // Start from current size and shrink until fits or hit min
    let s = Math.min(size, maxSize)
    // Temporarily ensure nowrap and measure natural width
    el.style.fontSize = s + 'px'
    el.style.whiteSpace = 'nowrap'
    el.style.display = 'inline-block'
    el.style.maxWidth = available + 'px'
    el.style.overflow = 'hidden'

    // If already fits, we may try to grow a bit up to maxSize (in case parent got wider)
    if (el.scrollWidth <= available) {
      while (s + step <= maxSize) {
        el.style.fontSize = (s + step) + 'px'
        if (el.scrollWidth > available) break
        s += step
      }
      setSize(s)
      return
    }

    while (s - step >= minSize) {
      el.style.fontSize = (s - step) + 'px'
      if (el.scrollWidth <= available) { s -= step; break }
      s -= step
    }
    setSize(Math.max(minSize, s))
  }

  useLayoutEffect(() => { measureAndFit() }, [content])
  useEffect(() => {
    function onResize(){ measureAndFit() }
    window.addEventListener('resize', onResize)
    // Observe parent size changes
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => measureAndFit()) : null
    if (ro && spanRef.current?.parentElement) ro.observe(spanRef.current.parentElement)
    return () => {
      window.removeEventListener('resize', onResize)
      if (ro && spanRef.current?.parentElement) ro.unobserve(spanRef.current.parentElement)
    }
  }, [])

  return (
    <span ref={spanRef} className={className} style={{ fontSize: size, lineHeight: 1.1, whiteSpace: 'nowrap', display: 'inline-block' }}>
      {content}
    </span>
  )
}

