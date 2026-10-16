import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { api, shortUrlFor } from '../api'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../components/Toast'
import './Dashboard.css'

export default function Dashboard() {
  const { user, loading: authLoading, isAuthenticated } = useAuth()
  const { show } = useToast()
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [created, setCreated] = useState(null)
  const [insight, setInsight] = useState('')
  const [aiBusy, setAiBusy] = useState(false)
  const [askAnswer, setAskAnswer] = useState('')
  const nameRef = useRef(null)
  const suggestTimer = useRef(null)

  const loadLinks = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.myLinks()
      setLinks(Array.isArray(res?.data) ? res.data : [])
    } catch (err) {
      show(err.message || 'Could not load links', 'error')
    } finally {
      setLoading(false)
    }
  }, [show])

  useEffect(() => {
    if (isAuthenticated) loadLinks()
  }, [isAuthenticated, loadLinks])

  const totals = useMemo(() => {
    const visits = links.reduce((s, l) => s + Number(l.visits || 0), 0)
    return { count: links.length, visits }
  }, [links])

  if (authLoading) {
    return (
      <main className="container dash">
        <p className="muted">Loading…</p>
      </main>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />

  async function onCreate(e) {
    e.preventDefault()
    setCreating(true)
    const fd = new FormData(e.currentTarget)
    const longUrl = String(fd.get('longUrl') || '').trim()
    const linkName = String(fd.get('linkName') || '').trim()
    try {
      const res = await api.createLink(linkName, longUrl)
      setCreated(res?.data || null)
      e.currentTarget.reset()
      show('Short URL created', 'success')
      await loadLinks()
    } catch (err) {
      show(err.message || 'Could not create link', 'error')
    } finally {
      setCreating(false)
    }
  }

  function onLongUrlInput(e) {
    const url = e.target.value.trim()
    const nameInput = nameRef.current
    if (!nameInput || nameInput.value.trim() || !/^https?:\/\//i.test(url)) return
    clearTimeout(suggestTimer.current)
    suggestTimer.current = setTimeout(async () => {
      try {
        const res = await api.ai.suggestName(url)
        if (res?.data?.name && !nameInput.value.trim()) {
          nameInput.value = res.data.name
        }
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

  async function onDelete(id) {
    if (!window.confirm('Delete this short URL?')) return
    try {
      await api.deleteLink(id)
      show('Deleted', 'success')
      setLinks((prev) => prev.filter((l) => l._id !== id))
    } catch (err) {
      show(err.message || 'Delete failed', 'error')
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
    } catch (err) {
      show(err.message || 'Could not answer', 'error')
    } finally {
      setAiBusy(false)
    }
  }

  const firstName = (user?.fullName || user?.username || 'there').split(' ')[0]

  return (
    <main className="container dash fade-up">
      <header className="dash-header">
        <div>
          <h1>Hey, {firstName}</h1>
          <p className="muted">Create, manage, and understand your short links.</p>
        </div>
      </header>

      <section className="card create-card">
        <h2>Create a short URL</h2>
        <form className="create-form" onSubmit={onCreate}>
          <label className="field grow">
            <span className="sr-only">Long URL</span>
            <input
              name="longUrl"
              type="url"
              required
              placeholder="Paste your long URL (https://…)"
              onChange={onLongUrlInput}
            />
          </label>
          <label className="field name-field">
            <span className="sr-only">Link name</span>
            <input
              ref={nameRef}
              name="linkName"
              maxLength={20}
              placeholder="Name (optional)"
            />
          </label>
          <button className="btn btn-primary" type="submit" disabled={creating}>
            {creating ? 'Creating…' : 'Shorten'}
          </button>
        </form>

        {created && (
          <div className="create-result">
            <span className="muted">Your short link</span>
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
      </section>

      <section className="summary-row">
        <div className="summary-item">
          <span>Links</span>
          <strong>{totals.count}</strong>
        </div>
        <div className="summary-item">
          <span>Visits</span>
          <strong>{totals.visits}</strong>
        </div>
        <div className="summary-item ai-item">
          <span>AI insight</span>
          <p>{insight || 'Ask AI for a quick read on your portfolio.'}</p>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onAskInsight} disabled={aiBusy}>
            {aiBusy ? 'Thinking…' : 'Ask AI'}
          </button>
        </div>
      </section>

      <section className="card ask-card">
        <h2>Ask Shortly AI</h2>
        <p className="muted">Questions about your whole portfolio.</p>
        <form className="ask-form" onSubmit={onAskQuestion}>
          <input name="question" maxLength={500} placeholder="Which link should I promote this week?" />
          <button className="btn btn-primary btn-sm" type="submit" disabled={aiBusy}>
            Ask
          </button>
        </form>
        {askAnswer && <p className="ask-answer">{askAnswer}</p>}
      </section>

      <section className="card links-card">
        <div className="links-head">
          <h2>Your links</h2>
        </div>

        {loading && <p className="muted">Loading links…</p>}

        {!loading && links.length === 0 && (
          <p className="muted empty">No links yet. Create your first one above.</p>
        )}

        <ul className="link-list">
          {links.map((link, i) => {
            const url = shortUrlFor(link.shortCode)
            return (
              <li
                key={link._id}
                className="link-row"
                style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
              >
                <div className="link-main">
                  <strong>{link.linkName || link.shortCode}</strong>
                  <a href={url} target="_blank" rel="noreferrer">
                    {url}
                  </a>
                  <span className="muted long-url">{link.longUrl}</span>
                </div>
                <div className="link-meta">
                  <span>{Number(link.visits || 0)} visits</span>
                  <span className="muted">
                    {link.createdAt
                      ? new Date(link.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })
                      : ''}
                  </span>
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
      </section>
    </main>
  )
}
