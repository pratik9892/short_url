import './ui.css'

export default function Card({ title, description, children, className = '', flat = false }) {
  return (
    <section className={`ui-card${flat ? ' ui-card--flat' : ''} ${className}`.trim()}>
      {title && <h2 className="ui-card__title">{title}</h2>}
      {description && <p className="ui-card__desc">{description}</p>}
      {children}
    </section>
  )
}
