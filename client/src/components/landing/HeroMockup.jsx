import { useEffect, useState } from 'react'
import { IconArrowRight, IconChart, IconCheck, IconGlobe, IconLink } from '../ui/Icons'
import './HeroMockup.css'

const DEMOS = [
  { url: 'https://medium.com/@you/how-we-cut-p95-latency-by-90-percent', code: 'p95', clicks: 1284, top: 'India' },
  { url: 'https://github.com/you/shortly/pull/42/files?diff=split', code: 'pr42', clicks: 312, top: 'Germany' },
  { url: 'https://www.youtube.com/watch?v=system-design-url-shortener', code: 'yt7K', clicks: 4821, top: 'USA' },
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Self-playing demo: types a long URL, "shortens" it, then ticks up clicks. Loops through DEMOS.
export default function HeroMockup() {
  const [index, setIndex] = useState(0)
  const [typed, setTyped] = useState('')
  const [phase, setPhase] = useState('typing') // typing → working → done
  const [clicks, setClicks] = useState(0)
  const demo = DEMOS[index]

  useEffect(() => {
    let cancelled = false

    async function run() {
      setTyped('')
      setClicks(0)
      setPhase('typing')
      for (let i = 1; i <= demo.url.length; i++) {
        if (cancelled) return
        setTyped(demo.url.slice(0, i))
        await sleep(22)
      }
      await sleep(350)
      if (cancelled) return
      setPhase('working')
      await sleep(650)
      if (cancelled) return
      setPhase('done')

      const steps = 28
      for (let s = 1; s <= steps; s++) {
        if (cancelled) return
        setClicks(Math.round(demo.clicks * (1 - Math.pow(1 - s / steps, 3))))
        await sleep(40)
      }
      await sleep(2600)
      if (!cancelled) setIndex((i) => (i + 1) % DEMOS.length)
    }

    run()
    return () => {
      cancelled = true
    }
  }, [demo])

  return (
    <div className="demo" aria-hidden="true">
      <div className="demo__glow" />
      <div className="demo__window">
        <div className="demo__chrome">
          <span />
          <span />
          <span />
          <div className="demo__address">shortly.app/dashboard</div>
        </div>

        <div className="demo__body">
          <div className="demo__input">
            <IconLink size={15} />
            <span className="demo__typed">
              {/* keep the tail of the URL visible while it types */}
              {typed.length > 46 ? `…${typed.slice(-45)}` : typed}
              {phase === 'typing' && <span className="demo__caret" />}
            </span>
            <span className={`demo__btn demo__btn--${phase}`}>
              {phase === 'working' ? <span className="spinner" /> : phase === 'done' ? <IconCheck size={14} /> : <IconArrowRight size={14} />}
            </span>
          </div>

          <div className={`demo__result${phase === 'done' ? ' is-visible' : ''}`}>
            <div className="demo__short">
              <span className="demo__short-host">shortly.app/</span>
              <span className="demo__short-code">{demo.code}</span>
            </div>
            <div className="demo__stats">
              <div className="demo__stat">
                <IconChart size={14} />
                <strong>{clicks.toLocaleString()}</strong>
                <span>clicks</span>
              </div>
              <div className="demo__stat">
                <IconGlobe size={14} />
                <strong>{demo.top}</strong>
                <span>top country</span>
              </div>
              <div className="demo__stat demo__stat--live">
                <span className="demo__live-dot" />
                <strong>4.8 ms</strong>
                <span>redirect</span>
              </div>
            </div>
            <div className="demo__spark">
              {Array.from({ length: 24 }).map((_, i) => (
                <span
                  key={`${index}-${i}`}
                  style={{
                    '--h': `${18 + Math.abs(Math.sin((i + index * 3) * 0.7)) * 70 + (i / 24) * 12}%`,
                    '--i': i,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
