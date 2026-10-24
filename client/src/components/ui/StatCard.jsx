import { useCountUp } from '../../hooks/useCountUp'
import { trackSpotlight } from './spotlight'
import './ui.css'

export default function StatCard({ label, value, icon, hint, style }) {
  const display = useCountUp(value)

  return (
    <div className="ui-stat" onPointerMove={trackSpotlight} style={style}>
      <span className="ui-stat__label">
        {icon && <span className="ui-stat__icon">{icon}</span>}
        {label}
      </span>
      <strong className="ui-stat__value" title={String(value)}>
        {typeof display === 'number' ? display.toLocaleString() : display}
      </strong>
      {hint && <span className="ui-stat__hint">{hint}</span>}
    </div>
  )
}
