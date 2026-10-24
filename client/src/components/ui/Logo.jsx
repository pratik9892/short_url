import { Link } from 'react-router-dom'
import './ui.css'

export default function Logo({ to = '/', className = '' }) {
  return (
    <Link to={to} className={`logo ${className}`.trim()} aria-label="Shortly home">
      <span className="logo__mark" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M10 14l4-4M11 6.5l1.2-1.2a4.2 4.2 0 0 1 6 6L17 12.5M13 17.5l-1.2 1.2a4.2 4.2 0 0 1-6-6L7 11.5" />
        </svg>
      </span>
      <span className="logo__text">Shortly</span>
    </Link>
  )
}
