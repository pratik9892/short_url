import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import './Layout.css'

export default function Layout() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="site-shell">
      <header className="site-nav">
        <div className="container site-nav__inner">
          <Link to="/" className="site-nav__brand">
            Shortly
          </Link>
          <nav className="site-nav__links">
            {isAuthenticated ? (
              <NavLink to="/dashboard" className="btn btn-primary btn-sm">
                Dashboard
              </NavLink>
            ) : (
              <>
                <NavLink to="/login">Log in</NavLink>
                <NavLink to="/register" className="btn btn-primary btn-sm">
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
