import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { api, shortUrlFor } from '../api'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../components/Toast'
import Card from '../components/ui/Card'
import StatCard from '../components/ui/StatCard'
import PageHeader from '../components/ui/PageHeader'
import CollapsibleText from '../components/ui/CollapsibleText'
import './Dashboard.css'

export default function Dashboard() {
  const { user, loading: authLoading, isAuthenticated } = useAuth()
  const { show } = useToast()
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [created, setCreated] = useState(null)
  const [longUrl, setLongUrl] = useState('')
  const [linkName, setLinkName] = useState('')
  const [insight, setInsight] = useState('')
  const [aiBusy, setAiBusy] = useState(false)
  const [askAnswer, setAskAnswer] = useState('')
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const suggestTimer = useRef(null)
  const formRef = useRef(null)

  const loadLinks = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true)
    try {
      const res = await api.myLinks()
      setLinks(Array.isArray(res?.data) ? res.data : [])
    } catch (err) {
      show(err.message || 'Could not load links', 'error')
    } finally {
      if (showSpinner) setLoading(false)
    }
  }, [show])

  useEffect(() => {
    if (isAuthenticated) loadLinks()
  }, [isAuthenticated, loadLinks])

  const totals = useMemo(() => {
    const visits = links.reduce((s, l) => s + Number(l.visits || 0), 0)
    return { count: links.length, visits }
  }, [links])

  const allSelected = links.length > 0 && selectedIds.size === links.length
  const someSelected = selectedIds.size > 0

  if (authLoading) {
    return <p className="muted dash-loading">Loading…</p>
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />

  function prependLink(newLink) {
    if (!newLink?._id) return
    setLinks((prev) => [newLink, ...prev.filter((l) => l._id !== newLink._id)])
  }

  async function onCreate(e) {
    e.preventDefault()
    const trimmedUrl = longUrl.trim()
    const trimmedName = linkName.trim()
    if (!trimmedUrl) return

    setCreating(true)
    try {
      const res = await api.createLink(trimmedName, trimmedUrl)
      const newLink = res?.data
      setCreated(newLink || null)
      prependLink(newLink)
      setLongUrl('')
      setLinkName('')
      formRef.current?.reset()
      clearTimeout(suggestTimer.current)
      setSelectedIds(new Set())
      show('Short URL created', 'success')
      loadLinks(false)
    } catch (err) {
      show(err.message || 'Could not create link', 'error')
    } finally {
      setCreating(false)
    }
  }

  function onLongUrlChange(e) {
    const url = e.target.value
    setLongUrl(url)
    const trimmed = url.trim()
    if (linkName.trim() || !/^https?:\/\//i.test(trimmed)) return
    clearTimeout(suggestTimer.current)
    suggestTimer.current = setTimeout(async () => {
      try {
        const res = await api.ai.suggestName(trimmed)
        if (res?.data?.name && !linkName.trim()) setLinkName(res.data.name)
      } catch {
        /* ignore */
      }
    }, 700)
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text)
      show('Copied', 'success')
    } catch {
      show('Could not copy', 'error')
    }
  }

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (allSelected) setSelectedIds(new Set())
    else setSelectedIds(new Set(links.map((l) => l._id)))
  }

  async function onDelete(id) {
    if (!window.confirm('Delete this short URL?')) return
    try {
      await api.deleteLink(id)
      show('Deleted', 'success')
      setLinks((prev) => prev.filter((l) => l._id !== id))
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    } catch (err) {
      show(err.message || 'Delete failed', 'error')
    }
  }

  async function onBulkDelete() {
    const ids = [...selectedIds]
    if (!ids.length) return
    if (!window.confirm(`Delete ${ids.length} selected short URL(s)?`)) return
    setBulkDeleting(true)
    try {
      const results = await Promise.allSettled(ids.map((id) => api.deleteLink(id)))
      const failed = results.filter((r) => r.status === 'rejected').length
      const ok = ids.length - failed
      setLinks((prev) => prev.filter((l) => !selectedIds.has(l._id)))
      setSelectedIds(new Set())
      if (failed) {
        show(`Deleted ${ok}; ${failed} failed`, 'error')
        loadLinks(false)
      } else show(`Deleted ${ok} link(s)`, 'success')
    } catch (err) {
      show(err.message || 'Bulk delete failed', 'error')
    } finally {
      setBulkDeleting(false)
    }
  }

  async function onAskInsight() {
    if (!links.length) {
      show('Create a link first', 'info')
      return
    }
    setAiBusy(true)
    try {
      const res = await api.ai.insight()
      setInsight(res?.data?.insight || '')
      show(`Insight ready (${res?.data?.provider || 'AI'})`, 'success')
    } catch (err) {
      show(err.message || 'AI unavailable', 'error')
    } finally {
      setAiBusy(false)
    }
  }

  async function onAskQuestion(e) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const question = String(fd.get('question') || '').trim()
    if (!question) return
    setAiBusy(true)
    try {
      const res = await api.ai.ask(question)
      setAskAnswer(res?.data?.answer || '')
      e.currentTarget.reset()
    } catch (err) {
      show(err.message || 'Could not answer', 'error')
    } finally {
      setAiBusy(false)
    }
  }

  const firstName = (user?.fullName || user?.username || 'there').split(' ')[0]

  return (
    <div className="dash">
      <PageHeader
        title={`Hey, ${firstName}`}
        subtitle="Create links, track visits, and ask AI about your portfolio."
      />

      <div className="dash-layout">
        <div className="dash-col dash-col--main">
          <Card title="New short link" className="dash-create">
            <form ref={formRef} className="create-form" onSubmit={onCreate}>
              <label className="field grow">
                <span>Long URL</span>
                <input
                  name="longUrl"
                  type="url"
                  required
                  placeholder="https://example.com/page"
                  value={longUrl}
                  onChange={onLongUrlChange}
                />
              </label>
              <label className="field">
                <span>Name</span>
                <input
                  name="linkName"
                  maxLength={20}
                  placeholder="Optional label"
                  value={linkName}
                  onChange={(e) => setLinkName(e.target.value)}
                />
              </label>
              <button className="btn btn-primary create-submit" type="submit" disabled={creating}>
                {creating ? 'Creating…' : 'Shorten'}
              </button>
            </form>
            {created && (
              <div className="create-result">
                <span className="muted">Latest</span>
                <div className="create-result-row">
                  <code>{shortUrlFor(created.shortCode)}</code>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => copyText(shortUrlFor(created.shortCode))}
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
          </Card>

          <Card
            title="Your links"
            className="dash-links"
            description={links.length ? `${links.length} active short URLs` : undefined}
          >
            {links.length > 0 && (
              <div className="links-toolbar">
                <label className="select-all">
                  <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
                  <span>Select all</span>
                </label>
                {someSelected && (
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={onBulkDelete}
                    disabled={bulkDeleting}
                  >
                    {bulkDeleting ? 'Deleting…' : `Delete (${selectedIds.size})`}
                  </button>
                )}
              </div>
            )}

            {loading && <p className="muted">Loading links…</p>}
            {!loading && links.length === 0 && (
              <p className="muted empty">No links yet. Create your first one above.</p>
            )}

            <ul className="link-list">
              {links.map((link, i) => {
                const url = shortUrlFor(link.shortCode)
                const checked = selectedIds.has(link._id)
                return (
                  <li
                    key={link._id}
                    className={`link-row${checked ? ' is-selected' : ''}`}
                    style={{ animationDelay: `${Math.min(i, 10) * 35}ms` }}
                  >
                    <label className="link-select">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSelect(link._id)}
                        aria-label={`Select ${link.linkName || link.shortCode}`}
                      />
                    </label>
                    <div className="link-main">
                      <strong>{link.linkName || link.shortCode}</strong>
                      <a href={url} target="_blank" rel="noreferrer">{url}</a>
                      <span className="muted long-url">{link.longUrl}</span>
                    </div>
                    <div className="link-meta">
                      <span>{Number(link.visits || 0)} clicks</span>
                    </div>
                    <div className="link-actions">
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => copyText(url)}>
                        Copy
                      </button>
                      <Link className="btn btn-ghost btn-sm" to={`/links/${link._id}/analytics`}>
                        Analytics
                      </Link>
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => onDelete(link._id)}>
                        Delete
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          </Card>
        </div>

        <aside className="dash-col dash-col--aside">
          <div className="dash-stats">
            <StatCard label="Links" value={totals.count} />
            <StatCard label="Visits" value={totals.visits} />
          </div>

          <Card title="AI insight" className="dash-ai-panel ui-panel">
            <div className="dash-ai-panel__inner">
              {insight ? (
                <CollapsibleText text={insight} collapsedLines={4} maxHeight="6.5rem" />
              ) : (
                <p className="ui-panel__placeholder">Portfolio summary from Shortly AI.</p>
              )}
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm dash-ai-btn"
              onClick={onAskInsight}
              disabled={aiBusy}
            >
              {aiBusy ? 'Thinking…' : 'Generate insight'}
            </button>
          </Card>

          <Card title="Ask AI" description="Questions about all your links." className="dash-ask ui-panel">
            <form className="ask-form" onSubmit={onAskQuestion}>
              <input name="question" maxLength={500} placeholder="What should I promote?" />
              <button className="btn btn-primary btn-sm" type="submit" disabled={aiBusy}>
                Ask
              </button>
            </form>
            {askAnswer && (
              <div className="dash-ask__answer">
                <CollapsibleText text={askAnswer} collapsedLines={3} maxHeight="5.5rem" />
              </div>
            )}
          </Card>
        </aside>
      </div>
    </div>
  )
}
