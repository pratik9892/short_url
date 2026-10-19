import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import './AppShell.css'

function IconGrid() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 13h6V4H4v9zm10 7h6v-9h-6v9zM4 20h6v-5H4v5zm10-11h6V4h-6v5z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconSettings() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.6.77 1.05 1.41 1.15H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function AppShell() {
  const { user, logout, isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const dashboardActive =
    location.pathname === '/dashboard' || location.pathname.startsWith('/links/')
  const settingsActive = location.pathname === '/settings'
  const first = (user?.fullName || user?.username || 'U').charAt(0).toUpperCase()

  async function onLogout() {
    await logout()
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="app-shell app-shell--center">
        <p className="muted">Loading…</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="app-shell">
      <aside className="app-sidebar" aria-label="App navigation">
        <Link to="/dashboard" className="app-sidebar__brand">
          Shortly
        </Link>

        <nav className="app-sidebar__nav">
          <NavLink
            to="/dashboard"
            className={`app-sidebar__link${dashboardActive ? ' is-active' : ''}`}
          >
            <IconGrid />
            <span>Dashboard</span>
          </NavLink>
          <NavLink
            to="/settings"
            className={`app-sidebar__link${settingsActive ? ' is-active' : ''}`}
          >
            <IconSettings />
            <span>Settings</span>
          </NavLink>
        </nav>

        <div className="app-sidebar__foot">
          <div className="app-user">
            <span className="app-user__avatar" aria-hidden="true">{first}</span>
            <div className="app-user__meta">
              <strong>{user?.fullName || user?.username}</strong>
              <span>{user?.email}</span>
            </div>
          </div>
          <button type="button" className="btn btn-ghost btn-sm app-sidebar__logout" onClick={onLogout}>
            Log out
          </button>
        </div>
      </aside>

      <div className="app-main">
        <Outlet />
      </div>
    </div>
  )
}
