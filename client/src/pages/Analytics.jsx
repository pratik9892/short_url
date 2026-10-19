import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { api, shortUrlFor } from '../api'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../components/Toast'
import Card from '../components/ui/Card'
import StatCard from '../components/ui/StatCard'
import PageHeader from '../components/ui/PageHeader'
import CollapsibleText from '../components/ui/CollapsibleText'
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

  return (
    <div className="analytics fade-up">
      <Link to="/dashboard" className="analytics-back">← Dashboard</Link>

      <PageHeader
        title={link?.linkName || 'Link analytics'}
        subtitle={
          link
            ? shortUrlFor(link.shortCode)
            : 'Performance for this short URL'
        }
      />

      {loading && <p className="muted">Loading analytics…</p>}

      {!loading && (
        <div className="analytics-grid">
          <section className="analytics-stats">
            <StatCard label="Clicks" value={stats.clicks} />
            <StatCard label="Countries" value={stats.countries} />
            <StatCard label="Mobile" value={stats.devices.mobile} />
            <StatCard label="Desktop" value={stats.devices.desktop} />
            <StatCard label="Top browser" value={stats.topBrowser} />
            <StatCard label="Top referrer" value={stats.topRef} />
          </section>

          <Card title="AI summary" className="analytics-ai">
            {summaryText ? (
              <CollapsibleText text={summaryText} collapsedLines={4} maxHeight="6rem" />
            ) : (
              <p className="ui-panel__placeholder">No summary yet.</p>
            )}
            {personaText && (
              <div className="analytics-persona">
                <h3>Audience</h3>
                <CollapsibleText text={personaText} collapsedLines={3} maxHeight="5rem" />
              </div>
            )}
          </Card>

          <Card title="Clicks · last 14 days" className="analytics-chart">
            <div className="bars" role="img" aria-label="Click chart">
              {stats.days.map((d) => (
                <div className="bar-col" key={d.label}>
                  <div
                    className="bar"
                    style={{ height: `${Math.max(6, (d.count / maxDay) * 100)}%` }}
                    title={`${d.label}: ${d.count}`}
                  />
                  <span>{d.label}</span>
                </div>
              ))}
            </div>
          </Card>

          {Array.isArray(ai?.forecast?.forecast) && (
            <Card title="7-day forecast" className="analytics-forecast">
              <p className="muted forecast-total">
                Projected total:{' '}
                <strong>{ai.forecast.forecast.reduce((a, b) => a + Number(b || 0), 0)}</strong> clicks
              </p>
              <div className="forecast-row">
                {ai.forecast.forecast.map((n, i) => (
                  <div key={i} className="forecast-pill">
                    <span>D{i + 1}</span>
                    <strong>{n}</strong>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card title="Ask about this link">
            <form className="ask-form" onSubmit={onAsk}>
              <input name="question" maxLength={500} placeholder="Who is clicking this link?" />
              <button className="btn btn-primary btn-sm" type="submit" disabled={asking}>
                {asking ? '…' : 'Ask AI'}
              </button>
            </form>
            {askAnswer && (
              <div className="analytics-ask-answer">
                <CollapsibleText text={askAnswer} collapsedLines={4} maxHeight="6rem" />
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
