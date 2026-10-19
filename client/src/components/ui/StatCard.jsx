import './ui.css'

export default function StatCard({ label, value }) {
  return (
    <div className="ui-stat">
      <span className="ui-stat__label">{label}</span>
      <strong className="ui-stat__value">{value}</strong>
    </div>
  )
}
