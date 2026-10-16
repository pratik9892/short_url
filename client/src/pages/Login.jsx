import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../components/Toast'
import './Auth.css'

export default function Login() {
  const { login, isAuthenticated } = useAuth()
  const { show } = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    try {
      await login(fd.get('email'), fd.get('password'))
      show('Welcome back', 'success')
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page fade-up">
      <div className="container auth-wrap">
        <div className="card auth-card">
          <h1>Welcome back</h1>
          <p className="muted">Log in to manage your short links.</p>

          <form onSubmit={onSubmit}>
            <label className="field">
              <span>Email</span>
              <input name="email" type="email" required placeholder="you@example.com" autoComplete="email" />
            </label>
            <label className="field">
              <span>Password</span>
              <input name="password" type="password" required placeholder="••••••••" autoComplete="current-password" />
            </label>

            {error && <p className="error-text">{error}</p>}

            <button className="btn btn-primary auth-submit" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Log in'}
            </button>
          </form>

          <p className="auth-switch muted">
            No account? <Link to="/register">Create one</Link>
          </p>
        </div>
      </div>
    </main>
  )
}
