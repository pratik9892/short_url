import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { api, shortUrlFor } from '../api'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../components/Toast'
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

  if (authLoading) {
    return (
      <main className="container analytics-page">
        <p className="muted">Loading…</p>
      </main>
    )
  }

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

  return (
    <main className="container analytics-page fade-up">
      <Link to="/dashboard" className="back-link muted">
        ← Back to dashboard
      </Link>

      <header className="analytics-header">
        <h1>{link?.linkName || 'Link analytics'}</h1>
        {link && (
          <p className="muted">
            <a href={shortUrlFor(link.shortCode)} target="_blank" rel="noreferrer">
              {shortUrlFor(link.shortCode)}
            </a>
          </p>
        )}
      </header>

      {loading && <p className="muted">Loading analytics…</p>}

      {!loading && (
        <>
          <section className="stat-grid">
            <div className="stat"><span>Clicks</span><strong>{stats.clicks}</strong></div>
            <div className="stat"><span>Countries</span><strong>{stats.countries}</strong></div>
            <div className="stat"><span>Mobile</span><strong>{stats.devices.mobile}</strong></div>
            <div className="stat"><span>Desktop</span><strong>{stats.devices.desktop}</strong></div>
            <div className="stat"><span>Top browser</span><strong>{stats.topBrowser}</strong></div>
            <div className="stat"><span>Top referrer</span><strong>{stats.topRef}</strong></div>
          </section>

          <section className="card ai-block">
            <h2>AI summary</h2>
            <p>{ai?.summary?.summary || 'No summary yet.'}</p>
            {ai?.persona?.persona && (
              <>
                <h3>Audience</h3>
                <p>{ai.persona.persona}</p>
              </>
            )}
          </section>

          <section className="card">
            <h2>Clicks · last 14 days</h2>
            <div className="bars" role="img" aria-label="Click chart for the last 14 days">
              {stats.days.map((d) => (
                <div className="bar-col" key={d.label}>
                  <div
                    className="bar"
                    style={{ height: `${Math.max(4, (d.count / maxDay) * 100)}%` }}
                    title={`${d.label}: ${d.count}`}
                  />
                  <span>{d.label}</span>
                </div>
              ))}
            </div>
          </section>

          {Array.isArray(ai?.forecast?.forecast) && (
            <section className="card">
              <h2>7-day forecast</h2>
              <p className="muted">
                Projected total:{' '}
                {ai.forecast.forecast.reduce((a, b) => a + Number(b || 0), 0)} clicks
              </p>
              <div className="forecast-row">
                {ai.forecast.forecast.map((n, i) => (
                  <div key={i} className="forecast-pill">
                    <span>D{i + 1}</span>
                    <strong>{n}</strong>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="card">
            <h2>Ask about this link</h2>
            <form className="ask-form" onSubmit={onAsk}>
              <input name="question" maxLength={500} placeholder="Who is clicking this link?" />
              <button className="btn btn-primary btn-sm" type="submit" disabled={asking}>
                {asking ? '…' : 'Ask AI'}
              </button>
            </form>
            {askAnswer && <p className="ask-answer">{askAnswer}</p>}
          </section>
        </>
      )}
    </main>
  )
}
