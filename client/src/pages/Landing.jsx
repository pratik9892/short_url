import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useInView } from '../hooks/useInView'
import HeroMockup from '../components/landing/HeroMockup'
import { trackSpotlight } from '../components/ui/spotlight'
import {
  IconArrowRight,
  IconBolt,
  IconChart,
  IconLink,
  IconShield,
  IconSparkles,
} from '../components/ui/Icons'
import './Landing.css'

const features = [
  {
    icon: <IconLink size={18} />,
    title: 'Short links, instantly',
    text: 'Paste a URL, get a short link. AI suggests a name while you type.',
  },
  {
    icon: <IconChart size={18} />,
    title: 'Click analytics',
    text: 'Countries, devices, referrers and a 14-day trend for every link.',
  },
  {
    icon: <IconSparkles size={18} />,
    title: 'AI insights',
    text: 'Ask questions about your links and get answers in plain language.',
  },
  {
    icon: <IconShield size={18} />,
    title: 'Secure by default',
    text: 'Google or email sign-in, JWT-protected APIs and rate limiting.',
  },
]

const steps = [
  { n: '1', title: 'Paste', text: 'Drop any long URL into your dashboard.' },
  { n: '2', title: 'Share', text: 'Copy the short link and post it anywhere.' },
  { n: '3', title: 'Learn', text: 'Watch clicks arrive and ask AI what they mean.' },
]

const HEADLINE = ['Short', 'links.']
const HEADLINE_2 = ['Real', 'insight.']

function Reveal({ children, className = '', as: Tag = 'section' }) {
  const [ref, visible] = useInView({ threshold: 0.15 })
  return (
    <Tag ref={ref} className={`reveal ${visible ? 'is-visible' : ''} ${className}`.trim()}>
      {children}
    </Tag>
  )
}

export default function Landing() {
  const { isAuthenticated } = useAuth()
  const ctaTo = isAuthenticated ? '/dashboard' : '/register'

  return (
    <main className="landing">
      <section className="hero bg-grid">
        <div className="hero__aurora" aria-hidden="true" />
        <div className="container hero__inner">
          <Link to={ctaTo} className="hero__pill">
            <span className="hero__pill-dot" />
            Redis-cached redirects in under 5 ms
            <IconArrowRight size={13} />
          </Link>

          <h1 className="hero__title">
            <span className="hero__line">
              {HEADLINE.map((w, i) => (
                <span key={w} className="hero__word" style={{ '--i': i }}>
                  {w}
                </span>
              ))}
            </span>
            <span className="hero__line hero__line--gradient">
              {HEADLINE_2.map((w, i) => (
                <span key={w} className="hero__word" style={{ '--i': i + 2 }}>
                  {w}
                </span>
              ))}
            </span>
          </h1>

          <p className="hero__lead">
            Shorten URLs, track every click, and let AI explain who your audience is. Fast, simple
            and open.
          </p>

          <div className="hero__cta">
            <Link to={ctaTo} className="btn btn-primary btn-lg">
              {isAuthenticated ? 'Open dashboard' : 'Start for free'}
              <IconArrowRight size={15} />
            </Link>
            {!isAuthenticated && (
              <Link to="/login" className="btn btn-ghost btn-lg">
                Log in
              </Link>
            )}
          </div>

          <div className="hero__demo">
            <HeroMockup />
          </div>
        </div>
      </section>

      <Reveal className="container section">
        <header className="section__head">
          <span className="section__eyebrow">Features</span>
          <h2>Everything a link needs. Nothing it doesn't.</h2>
        </header>
        <div className="features">
          {features.map((f, i) => (
            <article
              key={f.title}
              className="feature"
              style={{ '--i': i }}
              onPointerMove={trackSpotlight}
            >
              <span className="feature__icon">{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </article>
          ))}
        </div>
      </Reveal>

      <Reveal className="container section">
        <header className="section__head">
          <span className="section__eyebrow">Under the hood</span>
          <h2>Built like a production system.</h2>
          <p>
            Redirects read from a Redis cache. Analytics are written by a background worker, so
            clicks never wait on the database.
          </p>
        </header>

        <div className="arch" aria-label="Architecture: browser to API to Redis cache, with MongoDB on cache miss and a BullMQ worker writing analytics">
          <div className="arch__row">
            <div className="arch__node">Browser</div>
            <div className="arch__wire"><span /></div>
            <div className="arch__node arch__node--accent">
              <IconBolt size={14} /> API
            </div>
            <div className="arch__wire"><span /></div>
            <div className="arch__node">
              Redis cache
              <small>~5 ms hit</small>
            </div>
          </div>
          <div className="arch__row arch__row--sub">
            <div className="arch__node arch__node--muted">
              MongoDB
              <small>on cache miss</small>
            </div>
            <div className="arch__wire arch__wire--rev"><span /></div>
            <div className="arch__node arch__node--muted">
              BullMQ worker
              <small>clicks · geo · visits</small>
            </div>
            <div className="arch__wire arch__wire--rev"><span /></div>
            <div className="arch__node arch__node--muted">
              Job queue
              <small>fire-and-forget</small>
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal className="container section">
        <header className="section__head">
          <span className="section__eyebrow">How it works</span>
          <h2>Three steps. Zero friction.</h2>
        </header>
        <ol className="steps">
          {steps.map((s, i) => (
            <li key={s.n} className="step" style={{ '--i': i }}>
              <span className="step__n">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </Reveal>

      <Reveal className="container section">
        <div className="cta-band">
          <div className="cta-band__glow" aria-hidden="true" />
          <h2>Ready to share smarter?</h2>
          <p>Create your first short link in under a minute.</p>
          <Link to={ctaTo} className="btn btn-primary btn-lg">
            {isAuthenticated ? 'Go to dashboard' : 'Create free account'}
            <IconArrowRight size={15} />
          </Link>
        </div>
      </Reveal>
    </main>
  )
}
