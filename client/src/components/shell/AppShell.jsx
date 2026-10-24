import { NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import Logo from '../ui/Logo'
import { IconGrid, IconLogout, IconSettings } from '../ui/Icons'
import './AppShell.css'

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
        <span className="app-boot" aria-label="Loading">
          <span />
          <span />
          <span />
        </span>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: <IconGrid size={17} />, active: dashboardActive },
    { to: '/settings', label: 'Settings', icon: <IconSettings size={17} />, active: settingsActive },
  ]

  return (
    <div className="app-shell">
      <aside className="app-sidebar" aria-label="App navigation">
        <Logo to="/dashboard" className="app-sidebar__brand" />

        <nav className="app-sidebar__nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={`app-sidebar__link${item.active ? ' is-active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="app-sidebar__foot">
          <div className="app-user">
            <span className="app-user__avatar" aria-hidden="true">{first}</span>
            <div className="app-user__meta">
              <strong>{user?.fullName || user?.username}</strong>
              <span>{user?.email}</span>
            </div>
            <button
              type="button"
              className="btn btn-quiet btn-icon btn-sm"
              onClick={onLogout}
              aria-label="Log out"
              title="Log out"
            >
              <IconLogout size={16} />
            </button>
          </div>
        </div>
      </aside>

      <main className="app-main bg-grid">
        <div key={location.pathname} className="app-main__inner page-enter">
          <Outlet />
        </div>
      </main>

      <nav className="app-tabbar" aria-label="App navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={`app-tabbar__link${item.active ? ' is-active' : ''}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
        <button type="button" className="app-tabbar__link" onClick={onLogout}>
          <IconLogout size={17} />
          <span>Log out</span>
        </button>
      </nav>
    </div>
  )
}
