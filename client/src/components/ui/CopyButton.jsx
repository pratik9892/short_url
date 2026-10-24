import { useEffect, useRef, useState } from 'react'
import { IconCheck, IconCopy } from './Icons'
import './ui.css'

// Copy-to-clipboard button whose icon morphs into a check for a moment after copying
export default function CopyButton({ text, label = 'Copy', onCopied, onError, className = 'btn btn-ghost btn-sm', showLabel = true }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  async function onClick() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      onCopied?.()
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 1600)
    } catch {
      onError?.()
    }
  }

  return (
    <button
      type="button"
      className={`${className} copy-btn${copied ? ' is-copied' : ''}`}
      onClick={onClick}
      aria-label={copied ? 'Copied' : label}
    >
      <span className="copy-btn__icons" aria-hidden="true">
        <IconCopy className="copy-btn__copy" size={14} />
        <IconCheck className="copy-btn__check" size={14} />
      </span>
      {showLabel && <span>{copied ? 'Copied' : label}</span>}
    </button>
  )
}
