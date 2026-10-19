import './ui.css'

export default function PageHeader({ title, subtitle }) {
  return (
    <header className="ui-page-header">
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </header>
  )
}
