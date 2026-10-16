import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../components/Toast'
import './Auth.css'

export default function Register() {
  const { register, login, isAuthenticated } = useAuth()
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
    const payload = {
      fullName: fd.get('fullName'),
      username: fd.get('username'),
      email: fd.get('email'),
      password: fd.get('password'),
    }
    try {
      await register(payload)
      await login(payload.email, payload.password)
      show('Account created', 'success')
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page fade-up">
      <div className="container auth-wrap">
        <div className="card auth-card">
          <h1>Create your account</h1>
          <p className="muted">Start shortening in under a minute.</p>

          <form onSubmit={onSubmit}>
            <label className="field">
              <span>Full name</span>
              <input name="fullName" required placeholder="Jane Doe" autoComplete="name" />
            </label>
            <label className="field">
              <span>Username</span>
              <input name="username" required placeholder="jane" autoComplete="username" />
            </label>
            <label className="field">
              <span>Email</span>
              <input name="email" type="email" required placeholder="you@example.com" autoComplete="email" />
            </label>
            <label className="field">
              <span>Password</span>
              <input name="password" type="password" required minLength={8} placeholder="••••••••" autoComplete="new-password" />
            </label>

            {error && <p className="error-text">{error}</p>}

            <button className="btn btn-primary auth-submit" type="submit" disabled={loading}>
              {loading ? 'Creating…' : 'Sign up'}
            </button>
          </form>

          <p className="auth-switch muted">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </main>
  )
}
