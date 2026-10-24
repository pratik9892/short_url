import { useEffect, useRef, useState } from 'react'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Animates a number from its previous value to `target` with an ease-out curve.
// Non-numeric targets (e.g. "Chrome") are returned unchanged.
export function useCountUp(target, duration = 900) {
  const isNumber = typeof target === 'number' && Number.isFinite(target)
  const [value, setValue] = useState(0)
  const fromRef = useRef(0)

  useEffect(() => {
    if (!isNumber) return

    const from = fromRef.current
    const ms = prefersReducedMotion() ? 0 : duration
    const start = performance.now()
    let frame

    const tick = (now) => {
      const t = ms ? Math.min(1, (now - start) / ms) : 1
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(Math.round(from + (target - from) * eased))
      if (t < 1) frame = requestAnimationFrame(tick)
      else fromRef.current = target
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, isNumber, duration])

  return isNumber ? value : target
}
