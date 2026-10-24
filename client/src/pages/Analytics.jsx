import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { api, shortUrlFor } from '../api'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../components/Toast'
import Card from '../components/ui/Card'
import StatCard from '../components/ui/StatCard'
import PageHeader from '../components/ui/PageHeader'
import CollapsibleText from '../components/ui/CollapsibleText'
import CopyButton from '../components/ui/CopyButton'
import {
  IconArrowLeft,
  IconChart,
  IconExternal,
  IconGlobe,
  IconSend,
  IconSparkles,
} from '../components/ui/Icons'
import './Analytics.css'

function buildDaySeries(rows) {
  const byDay = {}
  rows.forEach((r) => {
    const day = r.clickedAt
      ? new Date(r.clickedAt).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10)
    byDay[day] = (byDay[day] || 0) + 1
  })
  const days = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    days.push({
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      count: byDay[key] || 0,
    })
  }
  return days
}

export default function Analytics() {
  const { id } = useParams()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { show } = useToast()
  const [link, setLink] = useState(null)
  const [rows, setRows] = useState([])
  const [ai, setAi] = useState(null)
  const [loading, setLoading] = useState(true)
  const [askAnswer, setAskAnswer] = useState('')
  const [asking, setAsking] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || !id) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const [linkRes, rawRes, aiRes] = await Promise.all([
          api.getLink(id),
          api.analyticsForLink(id).catch(() => null),
          api.ai.linkAnalytics(id).catch(() => null),
        ])
        if (cancelled) return
        setLink(linkRes?.data || null)
        setRows(Array.isArray(rawRes?.data) ? rawRes.data : [])
        setAi(aiRes?.data || null)
      } catch (err) {
        show(err.message || 'Could not load analytics', 'error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id, isAuthenticated, show])

  const stats = useMemo(() => {
    const countries = new Set()
    const devices = { desktop: 0, mobile: 0, tablet: 0 }
    const browsers = {}
    const refs = {}
    rows.forEach((r) => {
      if (r.country) countries.add(r.country)
      const dt = r.deviceType ? String(r.deviceType).toLowerCase() : 'desktop'
      if (devices[dt] !== undefined) devices[dt]++
      else devices.desktop++
      if (r.browser) browsers[r.browser] = (browsers[r.browser] || 0) + 1
      if (r.referer) {
        try {
          const host = new URL(r.referer).hostname.replace(/^www\./, '')
          refs[host] = (refs[host] || 0) + 1
        } catch {
          refs[r.referer] = (refs[r.referer] || 0) + 1
        }
      }
    })
    const topBrowser = Object.entries(browsers).sort((a, b) => b[1] - a[1])[0]
    const topRef = Object.entries(refs).sort((a, b) => b[1] - a[1])[0]
    return {
      clicks: rows.length,
      countries: countries.size,
      devices,
      topBrowser: topBrowser?.[0] || '—',
      topRef: topRef?.[0] || 'Direct',
      days: buildDaySeries(rows),
    }
  }, [rows])

  if (authLoading) return <p className="muted analytics-loading">Loading…</p>
  if (!isAuthenticated) return <Navigate to="/login" replace />

  const maxDay = Math.max(1, ...stats.days.map((d) => d.count))

  async function onAsk(e) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const question = String(fd.get('question') || '').trim()
    if (!question) return
    setAsking(true)
    try {
      const res = await api.ai.ask(question, id)
      setAskAnswer(res?.data?.answer || '')
    } catch (err) {
      show(err.message || 'Could not answer', 'error')
    } finally {
      setAsking(false)
    }
  }

  const summaryText = ai?.summary?.summary || ''
  const personaText = ai?.persona?.persona || ''
  const forecast = Array.isArray(ai?.forecast?.forecast) ? ai.forecast.forecast.map((n) => Number(n || 0)) : null
  const maxForecast = forecast ? Math.max(1, ...forecast) : 1
  const deviceTotal = stats.devices.desktop + stats.devices.mobile + stats.devices.tablet
  const deviceRows = [
    { key: 'desktop', label: 'Desktop', value: stats.devices.desktop },
    { key: 'mobile', label: 'Mobile', value: stats.devices.mobile },
    { key: 'tablet', label: 'Tablet', value: stats.devices.tablet },
  ]
  const shortUrl = link ? shortUrlFor(link.shortCode) : ''

  return (
    <div className="analytics">
      <Link to="/dashboard" className="analytics-back">
        <IconArrowLeft size={14} /> Dashboard
      </Link>

      <PageHeader
        title={link?.linkName || (loading ? 'Loading…' : 'Link analytics')}
        subtitle={
          link ? (
            <span className="analytics-sub">
              <a href={shortUrl} target="_blank" rel="noreferrer" className="analytics-sub__short">
                {shortUrl}
              </a>
              <span className="analytics-sub__arrow">→</span>
              <span className="analytics-sub__long" title={link.longUrl}>
                {link.longUrl}
              </span>
            </span>
          ) : (
            'Performance for this short URL'
          )
        }
        action={
          link && (
            <div className="analytics-actions">
              <CopyButton text={shortUrl} onError={() => show('Could not copy', 'error')} />
              <a className="btn btn-ghost btn-sm" href={shortUrl} target="_blank" rel="noreferrer">
                <IconExternal size={14} /> Open
              </a>
            </div>
          )
        }
      />

      {loading && (
        <div className="analytics-grid" aria-label="Loading analytics">
          <section className="analytics-stats">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="ui-stat">
                <span className="skeleton" style={{ width: '45%', height: 10 }} />
                <span className="skeleton" style={{ width: '30%', height: 22, marginTop: 12 }} />
              </div>
            ))}
          </section>
          <div className="ui-card analytics-chart">
            <span className="skeleton" style={{ width: '30%', height: 12 }} />
            <span className="skeleton" style={{ width: '100%', height: 180, marginTop: 20, borderRadius: 10 }} />
          </div>
        </div>
      )}

      {!loading && (
        <div className="analytics-grid">
          <section className="analytics-stats stagger">
            <StatCard label="Clicks" value={stats.clicks} icon={<IconChart size={14} />} style={{ '--i': 0 }} />
            <StatCard label="Countries" value={stats.countries} icon={<IconGlobe size={14} />} style={{ '--i': 1 }} />
            <StatCard label="Top browser" value={stats.topBrowser} style={{ '--i': 2 }} />
            <StatCard label="Top referrer" value={stats.topRef} style={{ '--i': 3 }} />
          </section>

          <Card
            title="Clicks"
            description="Last 14 days"
            className="analytics-chart"
            action={<span className="analytics-chart__total">{stats.clicks.toLocaleString()} total</span>}
          >
            <div className="bars" role="img" aria-label={`Clicks over the last 14 days, ${stats.clicks} total`}>
              {stats.days.map((d, i) => (
                <div className="bar-col" key={d.label} style={{ '--i': i }}>
                  <div className="bar-track">
                    <div
                      className={`bar${d.count === 0 ? ' is-empty' : ''}`}
                      style={{ height: `${Math.max(3, (d.count / maxDay) * 100)}%` }}
                    >
                      <span className="bar-tip">
                        <strong>{d.count}</strong> {d.count === 1 ? 'click' : 'clicks'}
                        <em>{d.label}</em>
                      </span>
                    </div>
                  </div>
                  <span className="bar-label">{i % 2 === 0 || i === stats.days.length - 1 ? d.label : ''}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Devices" className="analytics-devices">
            {deviceTotal === 0 ? (
              <p className="ui-panel__placeholder">No clicks yet.</p>
            ) : (
              <>
                <div className="device-bar">
                  {deviceRows.map((d) =>
                    d.value > 0 ? (
                      <span
                        key={d.key}
                        className={`device-bar__seg device-bar__seg--${d.key}`}
                        style={{ flexGrow: d.value }}
                        title={`${d.label}: ${d.value}`}
                      />
                    ) : null
                  )}
                </div>
                <ul className="device-legend">
                  {deviceRows.map((d) => (
                    <li key={d.key}>
                      <span className={`device-dot device-dot--${d.key}`} />
                      {d.label}
                      <strong>{Math.round((d.value / deviceTotal) * 100)}%</strong>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Card>

          <Card title="AI summary" className="analytics-ai" action={<IconSparkles size={15} className="analytics-ai__icon" />}>
            {summaryText ? (
              <CollapsibleText text={summaryText} collapsedLines={4} maxHeight="6.5rem" />
            ) : (
              <p className="ui-panel__placeholder">No summary yet. It appears once this link gets some clicks.</p>
            )}
            {personaText && (
              <div className="analytics-persona">
                <h3>Audience</h3>
                <CollapsibleText text={personaText} collapsedLines={3} maxHeight="5rem" />
              </div>
            )}
          </Card>

          {forecast && (
            <Card
              title="7-day forecast"
              className="analytics-forecast"
              action={
                <span className="analytics-chart__total">
                  ~{forecast.reduce((a, b) => a + b, 0).toLocaleString()} clicks
                </span>
              }
            >
              <div className="forecast-row">
                {forecast.map((n, i) => (
                  <div key={i} className="forecast-col" style={{ '--i': i }}>
                    <div className="forecast-track">
                      <div className="forecast-bar" style={{ height: `${Math.max(6, (n / maxForecast) * 100)}%` }} />
                    </div>
                    <strong>{n}</strong>
                    <span>D{i + 1}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card title="Ask about this link" className="analytics-ask">
            <form className="ask-form" onSubmit={onAsk}>
              <input className="input" name="question" maxLength={500} placeholder="Who is clicking this link?" />
              <button className="btn btn-primary btn-icon" type="submit" disabled={asking} aria-label="Ask AI">
                {asking ? <span className="spinner" /> : <IconSend size={15} />}
              </button>
            </form>
            {askAnswer && (
              <div className="analytics-ask-answer">
                <CollapsibleText key={askAnswer} text={askAnswer} collapsedLines={4} maxHeight="6rem" />
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
