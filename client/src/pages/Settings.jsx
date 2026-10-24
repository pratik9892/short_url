import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../components/Toast'
import Card from '../components/ui/Card'
import PageHeader from '../components/ui/PageHeader'
import './Settings.css'

export default function Settings() {
  const { user, loading: authLoading, isAuthenticated, refresh } = useAuth()
  const { show } = useToast()

  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [profileBusy, setProfileBusy] = useState(false)

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordBusy, setPasswordBusy] = useState(false)

  const isGoogle = user?.authProvider === 'google'

  useEffect(() => {
    if (!user) return
    setFullName(user.fullName || '')
    setUsername(user.username || '')
    setEmail(user.email || '')
  }, [user])

  if (authLoading) return <p className="muted settings-loading">Loading…</p>
  if (!isAuthenticated) return <Navigate to="/login" replace />

  async function onSaveProfile(e) {
    e.preventDefault()
    setProfileBusy(true)
    try {
      await api.updateProfile({ fullName, username, email })
      await refresh()
      show('Profile updated', 'success')
    } catch (err) {
      show(err.message || 'Could not update profile', 'error')
    } finally {
      setProfileBusy(false)
    }
  }

  async function onChangePassword(e) {
    e.preventDefault()
    if (newPassword.length < 8) {
      show('New password must be at least 8 characters', 'error')
      return
    }
    if (newPassword !== confirmPassword) {
      show('New passwords do not match', 'error')
      return
    }
    setPasswordBusy(true)
    try {
      await api.updatePassword({ oldPassword, newPassword })
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      show('Password updated', 'success')
    } catch (err) {
      show(err.message || 'Could not change password', 'error')
    } finally {
      setPasswordBusy(false)
    }
  }

  return (
    <div className="settings">
      <PageHeader
        title="Settings"
        subtitle="Manage your account details and security."
      />

      <div className="settings-grid">
        <Card title="Profile" description="Update how you appear in Shortly.">
          <form className="settings-form" onSubmit={onSaveProfile}>
            <label className="field">
              <span>Full name</span>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                maxLength={80}
                autoComplete="name"
              />
            </label>
            <label className="field">
              <span>Username</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                maxLength={20}
                autoComplete="username"
              />
            </label>
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </label>
            <div className="settings-meta muted">
              Signed in via <strong>{isGoogle ? 'Google' : 'Email & password'}</strong>
            </div>
            <button type="submit" className="btn btn-primary" disabled={profileBusy}>
              {profileBusy && <span className="spinner" />}
              {profileBusy ? 'Saving…' : 'Save profile'}
            </button>
          </form>
        </Card>

        <Card title="Password" description="Keep your account secure.">
          {isGoogle ? (
            <p className="settings-note">
              This account uses <strong>Google sign-in</strong>. Password changes are handled by
              Google—not in Shortly.
            </p>
          ) : (
            <form className="settings-form" onSubmit={onChangePassword}>
              <label className="field">
                <span>Current password</span>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </label>
              <label className="field">
                <span>New password</span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </label>
              <label className="field">
                <span>Confirm new password</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </label>
              <button type="submit" className="btn btn-primary" disabled={passwordBusy}>
                {passwordBusy && <span className="spinner" />}
                {passwordBusy ? 'Updating…' : 'Change password'}
              </button>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}
