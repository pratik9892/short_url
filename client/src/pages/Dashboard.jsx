import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { api, shortUrlFor } from '../api'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../components/Toast'
import Card from '../components/ui/Card'
import StatCard from '../components/ui/StatCard'
import PageHeader from '../components/ui/PageHeader'
import CollapsibleText from '../components/ui/CollapsibleText'
import CopyButton from '../components/ui/CopyButton'
import {
  IconArrowRight,
  IconChart,
  IconLink,
  IconSend,
  IconSparkles,
  IconTrash,
} from '../components/ui/Icons'
import './Dashboard.css'

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

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
  const [query, setQuery] = useState('')
  const [today] = useState(() =>
    new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
  )
  const suggestTimer = useRef(null)
  const formRef = useRef(null)

  const loadLinks = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true)
    try {
      const res = await api.myLinks()
      const list = Array.isArray(res?.data) ? res.data : []
      // newest first, so a freshly created link stays at the top after the refresh
      setLinks([...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
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

  const topLink = useMemo(
    () => links.reduce((best, l) => (Number(l.visits || 0) > Number(best?.visits || 0) ? l : best), null),
    [links]
  )

  const visibleLinks = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return links
    return links.filter((l) =>
      [l.linkName, l.shortCode, l.longUrl].some((v) => String(v || '').toLowerCase().includes(q))
    )
  }, [links, query])

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

  const onCopyError = () => show('Could not copy', 'error')

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
        eyebrow={today}
        title={`Hey, ${firstName}`}
        subtitle="Create links, track clicks, and ask AI about your audience."
      />

      <section className="dash-stats stagger">
        <StatCard label="Links" value={totals.count} icon={<IconLink size={14} />} style={{ '--i': 0 }} />
        <StatCard label="Total clicks" value={totals.visits} icon={<IconChart size={14} />} style={{ '--i': 1 }} />
        <StatCard
          label="Top link"
          value={topLink && Number(topLink.visits) > 0 ? topLink.linkName || topLink.shortCode : '—'}
          hint={topLink && Number(topLink.visits) > 0 ? `${Number(topLink.visits).toLocaleString()} clicks` : 'No clicks yet'}
          icon={<IconSparkles size={14} />}
          style={{ '--i': 2 }}
        />
      </section>

      <div className="dash-layout">
        <div className="dash-col dash-col--main">
          <Card className="dash-create">
            <form ref={formRef} className="shorten" onSubmit={onCreate}>
              <label className="shorten__url">
                <IconLink size={16} />
                <span className="sr-only">Long URL</span>
                <input
                  name="longUrl"
                  type="url"
                  required
                  placeholder="Paste a long URL…"
                  value={longUrl}
                  onChange={onLongUrlChange}
                  autoComplete="off"
                />
              </label>
              <label className="shorten__name">
                <span className="sr-only">Name</span>
                <input
                  name="linkName"
                  maxLength={20}
                  placeholder="Name (optional)"
                  value={linkName}
                  onChange={(e) => setLinkName(e.target.value)}
                  autoComplete="off"
                />
              </label>
              <button className="btn btn-primary shorten__submit" type="submit" disabled={creating}>
                {creating ? <span className="spinner" /> : <IconArrowRight size={15} />}
                <span>{creating ? 'Shortening' : 'Shorten'}</span>
              </button>
            </form>

            {created && (
              <div className="shorten-result" key={created._id}>
                <span className="shorten-result__badge">New</span>
                <a className="shorten-result__url" href={shortUrlFor(created.shortCode)} target="_blank" rel="noreferrer">
                  {shortUrlFor(created.shortCode)}
                </a>
                <CopyButton text={shortUrlFor(created.shortCode)} onError={onCopyError} />
              </div>
            )}
          </Card>

          <Card
            title="Your links"
            className="dash-links"
            description={links.length ? `${links.length} short ${links.length === 1 ? 'link' : 'links'}` : undefined}
            action={
              links.length > 0 && (
                <input
                  className="input dash-search"
                  type="search"
                  placeholder="Search links…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Search links"
                />
              )
            }
          >
            {links.length > 0 && (
              <div className={`links-toolbar${someSelected ? ' has-selection' : ''}`}>
                <label className="select-all">
                  <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
                  <span>{someSelected ? `${selectedIds.size} selected` : 'Select all'}</span>
                </label>
                {someSelected && (
                  <button
                    type="button"
                    className="btn btn-danger is-solid btn-sm links-toolbar__delete"
                    onClick={onBulkDelete}
                    disabled={bulkDeleting}
                  >
                    {bulkDeleting ? <span className="spinner" /> : <IconTrash size={14} />}
                    {bulkDeleting ? 'Deleting…' : `Delete ${selectedIds.size}`}
                  </button>
                )}
              </div>
            )}

            {loading && (
              <ul className="link-list" aria-label="Loading links">
                {[0, 1, 2].map((i) => (
                  <li key={i} className="link-row link-row--skeleton">
                    <span className="skeleton" style={{ width: 16, height: 16 }} />
                    <span className="skeleton" style={{ width: 34, height: 34, borderRadius: 9 }} />
                    <div className="link-main">
                      <span className="skeleton" style={{ width: '40%', height: 12 }} />
                      <span className="skeleton" style={{ width: '65%', height: 10, marginTop: 8 }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {!loading && links.length === 0 && (
              <div className="empty">
                <span className="empty__icon">
                  <IconLink size={20} />
                </span>
                <strong>No links yet</strong>
                <p className="muted">Paste a URL above to create your first short link.</p>
              </div>
            )}

            {!loading && links.length > 0 && visibleLinks.length === 0 && (
              <p className="muted dash-nomatch">No links match “{query}”.</p>
            )}

            {!loading && (
              <ul className="link-list">
                {visibleLinks.map((link, i) => {
                  const url = shortUrlFor(link.shortCode)
                  const checked = selectedIds.has(link._id)
                  const isNew = created?._id === link._id
                  return (
                    <li
                      key={link._id}
                      className={`link-row${checked ? ' is-selected' : ''}${isNew ? ' is-new' : ''}`}
                      style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}
                    >
                      <label className="link-select">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSelect(link._id)}
                          aria-label={`Select ${link.linkName || link.shortCode}`}
                        />
                      </label>
                      <span className="link-avatar" aria-hidden="true">
                        {hostOf(link.longUrl).charAt(0).toUpperCase()}
                      </span>
                      <div className="link-main">
                        <div className="link-main__top">
                          <strong>{link.linkName || link.shortCode}</strong>
                          <a href={url} target="_blank" rel="noreferrer" className="link-short">
                            /{link.shortCode}
                          </a>
                        </div>
                        <span className="long-url" title={link.longUrl}>
                          {link.longUrl}
                        </span>
                      </div>
                      <Link className="link-clicks" to={`/links/${link._id}/analytics`} title="View analytics">
                        <IconChart size={13} />
                        {Number(link.visits || 0).toLocaleString()}
                      </Link>
                      <div className="link-actions">
                        <CopyButton
                          text={url}
                          onError={onCopyError}
                          className="btn btn-quiet btn-icon btn-sm"
                          showLabel={false}
                        />
                        <Link
                          className="btn btn-quiet btn-icon btn-sm"
                          to={`/links/${link._id}/analytics`}
                          aria-label="Analytics"
                          title="Analytics"
                        >
                          <IconArrowRight size={14} />
                        </Link>
                        <button
                          type="button"
                          className="btn btn-danger btn-icon btn-sm"
                          onClick={() => onDelete(link._id)}
                          aria-label="Delete"
                          title="Delete"
                        >
                          <IconTrash size={14} />
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        </div>

        <aside className="dash-col dash-col--aside">
          <Card
            title="AI insight"
            description="A summary of how your links perform."
            className="dash-ai ui-panel"
          >
            <div className={`dash-ai__body${aiBusy && !insight ? ' is-thinking' : ''}`}>
              {insight ? (
                <CollapsibleText key={insight} text={insight} collapsedLines={5} maxHeight="8rem" />
              ) : aiBusy ? (
                <div className="dash-ai__skeleton">
                  <span className="skeleton" style={{ width: '95%' }} />
                  <span className="skeleton" style={{ width: '80%' }} />
                  <span className="skeleton" style={{ width: '60%' }} />
                </div>
              ) : (
                <p className="ui-panel__placeholder">Generate an insight to see trends across all your links.</p>
              )}
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm dash-ai__btn"
              onClick={onAskInsight}
              disabled={aiBusy}
            >
              {aiBusy ? <span className="spinner" /> : <IconSparkles size={14} />}
              {aiBusy ? 'Thinking…' : insight ? 'Regenerate' : 'Generate insight'}
            </button>
          </Card>

          <Card title="Ask AI" description="Questions about all your links." className="dash-ask ui-panel">
            <form className="ask-form" onSubmit={onAskQuestion}>
              <input className="input" name="question" maxLength={500} placeholder="What should I promote?" />
              <button className="btn btn-primary btn-icon" type="submit" disabled={aiBusy} aria-label="Ask">
                {aiBusy ? <span className="spinner" /> : <IconSend size={15} />}
              </button>
            </form>
            {askAnswer && (
              <div className="dash-ask__answer">
                <CollapsibleText key={askAnswer} text={askAnswer} collapsedLines={4} maxHeight="7rem" />
              </div>
            )}
          </Card>
        </aside>
      </div>
    </div>
  )
}
