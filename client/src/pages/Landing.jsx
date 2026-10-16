import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import './Landing.css'

export default function Landing() {
  const { isAuthenticated } = useAuth()

  return (
    <main className="landing">
      <div className="landing-atmosphere" aria-hidden="true" />
      <section className="container landing-hero fade-up">
        <p className="brand-mark">Shortly</p>
        <h1>Short links with clear insight.</h1>
        <p className="landing-lead">
          Create clean short URLs, track every click, and ask AI what your audience is telling you.
        </p>
        <div className="landing-cta">
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn btn-primary">
              Open dashboard
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn btn-primary">
                Get started
              </Link>
              <Link to="/login" className="btn btn-ghost">
                Log in
              </Link>
            </>
          )}
        </div>
      </section>
    </main>
  )
}
