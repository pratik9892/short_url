import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useInView } from '../hooks/useInView'
import HeroMockup from '../components/landing/HeroMockup'
import heroImage from '../assets/hero.png'
import './Landing.css'

const features = [
  {
    icon: '🔗',
    title: 'Short links',
    text: 'Turn long URLs into branded short links with optional names and instant copy.',
  },
  {
    icon: '📊',
    title: 'Click analytics',
    text: 'See devices, countries, referrers, and a 14-day chart for every link you share.',
  },
  {
    icon: '✨',
    title: 'AI insights',
    text: 'Ask Shortly to summarize performance or suggest what to promote next.',
  },
  {
    icon: '🔐',
    title: 'Secure accounts',
    text: 'Email sign-up or Google login with JWT-protected dashboard access.',
  },
]

const steps = [
  { n: '01', title: 'Paste a URL', text: 'Drop any long link into the dashboard shorten form.' },
  { n: '02', title: 'Share the short link', text: 'Copy your Shortly URL and post it anywhere.' },
  { n: '03', title: 'Learn from clicks', text: 'Open analytics and AI to see who engaged and when.' },
]

function RevealSection({ children, className = '' }) {
  const [ref, visible] = useInView({ threshold: 0.12 })
  return (
    <section
      ref={ref}
      className={`landing-reveal ${visible ? 'is-visible' : ''} ${className}`.trim()}
    >
      {children}
    </section>
  )
}

export default function Landing() {
  const { isAuthenticated } = useAuth()

  return (
    <main className="landing">
      <div className="landing-orb landing-orb--a" aria-hidden="true" />
      <div className="landing-orb landing-orb--b" aria-hidden="true" />

      <section className="landing-hero container">
        <div className="landing-hero__grid">
          <div className="landing-hero__copy fade-up">
            <p className="landing-eyebrow">
              <span className="landing-eyebrow__dot" />
              URL shortener · analytics · AI
            </p>
            <h1>
              Share smarter links.
              <span className="landing-gradient-text"> Know what works.</span>
            </h1>
            <p className="landing-lead">
              Shortly is a modern link platform for creators and teams—short URLs, real-time
              click data, and AI that explains your audience in plain language.
            </p>
            <div className="landing-cta">
              {isAuthenticated ? (
                <Link to="/dashboard" className="btn btn-primary btn-lg">
                  Open dashboard
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn btn-primary btn-lg">
                    Get started free
                  </Link>
                  <Link to="/login" className="btn btn-ghost btn-lg">
                    Log in
                  </Link>
                </>
              )}
            </div>
            <ul className="landing-trust">
              <li>No credit card</li>
              <li>Google sign-in</li>
              <li>Built for speed</li>
            </ul>
          </div>

          <div className="landing-hero__visual fade-up" style={{ animationDelay: '120ms' }}>
            <div className="landing-hero__image-wrap">
              <img
                src={heroImage}
                alt="Shortly dashboard preview"
                className="landing-hero__image"
                width={640}
                height={480}
                loading="eager"
              />
            </div>
            <HeroMockup />
          </div>
        </div>
      </section>

      <RevealSection className="landing-stats container">
        <div className="landing-stat">
          <strong>1-click</strong>
          <span>Shorten & copy</span>
        </div>
        <div className="landing-stat">
          <strong>14-day</strong>
          <span>Click charts</span>
        </div>
        <div className="landing-stat">
          <strong>AI</strong>
          <span>Portfolio Q&A</span>
        </div>
        <div className="landing-stat">
          <strong>Secure</strong>
          <span>JWT + cookies</span>
        </div>
      </RevealSection>

      <RevealSection className="container landing-section">
        <header className="landing-section__head">
          <h2>Everything you need to grow with links</h2>
          <p className="muted">
            One dashboard to create, measure, and understand every URL you share.
          </p>
        </header>
        <div className="landing-features">
          {features.map((f, i) => (
            <article
              key={f.title}
              className="landing-feature"
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <span className="landing-feature__icon" aria-hidden="true">{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </article>
          ))}
        </div>
      </RevealSection>

      <RevealSection className="landing-showcase">
        <div className="container landing-showcase__inner">
          <div className="landing-showcase__copy">
            <h2>See the full picture per link</h2>
            <p>
              Drill into analytics for any short URL—clicks over time, top referrers, device mix,
              and AI-generated summaries so you spend less time in spreadsheets.
            </p>
            <Link to={isAuthenticated ? '/dashboard' : '/register'} className="btn btn-primary">
              {isAuthenticated ? 'View your links' : 'Try Shortly'}
            </Link>
          </div>
          <div className="landing-showcase__visual">
            <img src={heroImage} alt="" className="landing-showcase__img" loading="lazy" />
            <div className="landing-showcase__card">
              <span className="muted">AI insight</span>
              <p>
                Mobile traffic leads at 62%. Promote your top link on Instagram this week for the
                best lift.
              </p>
            </div>
          </div>
        </div>
      </RevealSection>

      <RevealSection className="container landing-section">
        <header className="landing-section__head">
          <h2>How it works</h2>
          <p className="muted">Three steps from long URL to actionable insight.</p>
        </header>
        <ol className="landing-steps">
          {steps.map((s, i) => (
            <li key={s.n} className="landing-step" style={{ transitionDelay: `${i * 80}ms` }}>
              <span className="landing-step__n">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </RevealSection>

      <RevealSection className="landing-cta-band">
        <div className="container landing-cta-band__inner">
          <h2>Ready to shorten your first link?</h2>
          <p>Join Shortly and turn every click into clarity.</p>
          <Link
            to={isAuthenticated ? '/dashboard' : '/register'}
            className="btn btn-primary btn-lg landing-cta-band__btn"
          >
            {isAuthenticated ? 'Go to dashboard' : 'Create free account'}
          </Link>
        </div>
      </RevealSection>
    </main>
  )
}
