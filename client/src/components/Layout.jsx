import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Logo from './ui/Logo'
import { IconArrowRight } from './ui/Icons'
import './Layout.css'

export default function Layout() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)

  // nav turns into a frosted bar once the page scrolls
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="site-shell">
      <header className={`site-nav${scrolled ? ' is-scrolled' : ''}`}>
        <div className="container site-nav__inner">
          <Logo />
          <nav className="site-nav__links">
            {isAuthenticated ? (
              <NavLink to="/dashboard" className="btn btn-primary btn-sm">
                Dashboard <IconArrowRight size={14} />
              </NavLink>
            ) : (
              <>
                <NavLink to="/login" className="site-nav__link">
                  Log in
                </NavLink>
                <NavLink to="/register" className="btn btn-primary btn-sm">
                  Get started
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </header>

      <div key={location.pathname} className="page-enter site-main">
        <Outlet />
      </div>

      <footer className="site-footer">
        <div className="container site-footer__inner">
          <Logo />
          <span className="muted">Built with React, Express, MongoDB, Redis &amp; BullMQ.</span>
        </div>
      </footer>
    </div>
  )
}
