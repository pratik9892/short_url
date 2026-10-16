import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import './Layout.css'

export default function Layout() {
  const { user, logout, isAuthenticated } = useAuth()

  return (
    <div className="shell">
      <header className="nav">
        <div className="container nav-inner">
          <Link to="/" className="brand">
            Shortly
          </Link>
          <nav className="nav-links">
            {isAuthenticated ? (
              <>
                <NavLink to="/dashboard">Dashboard</NavLink>
                <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>
                  Log out{user?.fullName ? ` · ${user.fullName.split(' ')[0]}` : ''}
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login">Log in</NavLink>
                <NavLink to="/register" className="btn btn-primary btn-sm nav-cta">
                  Sign up
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </header>
      <Outlet />
    </div>
  )
}
