import './ui.css'

export default function PageHeader({ title, subtitle, eyebrow, action }) {
  return (
    <header className="ui-page-header">
      <div>
        {eyebrow && <div className="ui-page-header__eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action && <div className="ui-page-header__action">{action}</div>}
    </header>
  )
}
