import './HeroMockup.css'

export default function HeroMockup() {
  return (
    <div className="hero-mockup" aria-hidden="true">
      <div className="hero-mockup__glow" />
      <div className="hero-mockup__window">
        <div className="hero-mockup__chrome">
          <span /><span /><span />
        </div>
        <div className="hero-mockup__body">
          <div className="hero-mockup__field hero-mockup__field--long">
            <span className="hero-mockup__label">Long URL</span>
            <span className="hero-mockup__value hero-mockup__typing-long">
              https://your-site.com/blog/post
            </span>
          </div>
          <div className="hero-mockup__arrow">↓</div>
          <div className="hero-mockup__field hero-mockup__field--short">
            <span className="hero-mockup__label">Shortly</span>
            <span className="hero-mockup__value hero-mockup__pulse-short">
              shortly.link/a8K2
            </span>
          </div>
          <div className="hero-mockup__stats">
            <div><strong>248</strong><span>clicks</span></div>
            <div><strong>12</strong><span>countries</span></div>
            <div><strong>AI</strong><span>insight</span></div>
          </div>
        </div>
      </div>
      <div className="hero-mockup__float hero-mockup__float--a">+34% mobile</div>
      <div className="hero-mockup__float hero-mockup__float--b">Peak Tue 6pm</div>
    </div>
  )
}
