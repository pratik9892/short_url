import { trackSpotlight } from './spotlight'
import './ui.css'

export default function Card({ title, description, action, children, className = '', flat = false, style }) {
  return (
    <section
      className={`ui-card${flat ? ' ui-card--flat' : ''} ${className}`.trim()}
      onPointerMove={trackSpotlight}
      style={style}
    >
      {(title || action) && (
        <header className="ui-card__head">
          <div>
            {title && <h2 className="ui-card__title">{title}</h2>}
            {description && <p className="ui-card__desc">{description}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  )
}
