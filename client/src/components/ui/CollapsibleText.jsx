import { useState } from 'react'
import './ui.css'

export default function CollapsibleText({
  text,
  collapsedLines = 3,
  maxHeight = '7.5rem',
  className = '',
}) {
  const [expanded, setExpanded] = useState(false)
  const long = (text || '').length > 120

  if (!text) return null

  return (
    <div className={`collapsible-text ${className}`.trim()}>
      <div
        className={`ui-panel__body${expanded ? '' : ' ui-panel__body--clamp'}`}
        style={expanded ? { maxHeight: 'none' } : { maxHeight }}
      >
        <p
          className={expanded ? '' : 'is-clamped'}
          style={expanded ? undefined : { WebkitLineClamp: collapsedLines }}
        >
          {text}
        </p>
      </div>
      {long && (
        <button
          type="button"
          className="ui-text-toggle"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  )
}
