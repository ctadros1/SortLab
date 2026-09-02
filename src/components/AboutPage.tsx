import { AppIcon } from './Icon'

const technicalDetails = [
  ['Interface', 'React 19, TypeScript, semantic HTML'],
  ['Build', 'Vite with Cloudflare Workers static assets'],
  ['Visualization', 'DOM bars for guided study; Canvas 2D at Sandbox scale'],
  ['Audio', 'Web Audio API with operation-aware scheduling'],
  ['Timing', 'performance.now() around operation generation'],
  ['Testing', 'Vitest plus Playwright browser flows'],
] as const

export function AboutPage() {
  return (
    <main className="about-page" id="main-content">
      <header className="about-intro">
        <div>
          <h1>About SortLab</h1>
          <p>
            SortLab turns sorting algorithms into something you can see, hear, compare, and
            inspect—without hiding the mechanics behind a single animated result.
          </p>
        </div>
        <span className="about-intro__principle">
          <AppIcon name="check" aria-hidden="true" />
          <span>
            <strong>Built for understanding</strong>
            <small>Every animation is driven by an explicit algorithm operation.</small>
          </span>
        </span>
      </header>

      <div className="about-columns">
        <div className="about-column">
          <section className="about-section">
            <span className="about-section__icon" aria-hidden="true">
              <AppIcon name="learn" />
            </span>
            <div>
              <h2>What SortLab teaches</h2>
              <p>
                Visualize slows an implementation down to individual comparisons, writes, and swaps.
                Compare places two algorithms on the same input. Learn explains the ideas and
                tradeoffs. Benchmark measures generation work, while Sandbox scales the same
                concepts to thousands of values.
              </p>
            </div>
          </section>

          <section className="about-section about-section--architecture">
            <span className="about-section__icon" aria-hidden="true">
              <AppIcon name="depth" />
            </span>
            <div>
              <h2>One event stream, several ways to learn</h2>
              <p>
                The guided experience normalizes each implementation into a shared operation
                vocabulary. That keeps the visual, narration, statistics, code highlighting, and
                sound synchronized.
              </p>
              <div className="architecture-flow" aria-label="SortLab event-stream architecture">
                <span>
                  <AppIcon name="algorithm" aria-hidden="true" />
                  <strong>Algorithm engine</strong>
                  <small>Runs deterministic input</small>
                </span>
                <i aria-hidden="true">→</i>
                <span className="architecture-flow__core">
                  <AppIcon name="steps" aria-hidden="true" />
                  <strong>Normalized operations</strong>
                  <small>Compare · swap · write · pivot</small>
                </span>
                <i aria-hidden="true">→</i>
                <span>
                  <AppIcon name="activity" aria-hidden="true" />
                  <strong>Learning layers</strong>
                  <small>Visual · audio · code · stats</small>
                </span>
              </div>
            </div>
          </section>

          <section className="about-section">
            <span className="about-section__icon" aria-hidden="true">
              <AppIcon name="speed" />
            </span>
            <div>
              <h2>Why browser limits exist</h2>
              <p>
                Some algorithms produce millions of operations long before they run out of values to
                sort. Their limits protect the browser from an event stream that would consume too
                much memory or lock the interface. Sandbox uses batched, browser-native
                implementations where practical and explains any automatic amount adjustment.
              </p>
            </div>
          </section>

          <section className="about-section">
            <span className="about-section__icon" aria-hidden="true">
              <AppIcon name="timer" />
            </span>
            <div>
              <h2>What measured execution time means</h2>
              <p>
                SortLab measures the JavaScript work needed to generate an operation stream. It
                excludes animation duration, so comparisons made on the same device are useful. It
                is not a universal hardware benchmark or a replacement for profiling production
                code.
              </p>
            </div>
          </section>
        </div>

        <div className="about-column">
          <section className="about-section">
            <span className="about-section__icon about-section__icon--teal" aria-hidden="true">
              <AppIcon name="code" />
            </span>
            <div>
              <h2>Open source and transparent</h2>
              <p>
                SortLab’s source is public, so its algorithms, visual models, and browser limits can
                be inspected and improved. Arrays, playback events, preferences, and benchmark
                results stay in your browser; a bug report is sent only when you submit the form.
              </p>
            </div>
          </section>

          <section className="about-section">
            <span className="about-section__icon" aria-hidden="true">
              <AppIcon name="keyboard" />
            </span>
            <div>
              <h2>Accessible by design</h2>
              <p>
                Controls use semantic labels, keyboard navigation, visible focus, reduced-motion
                support, high-contrast themes, and text explanations that do not rely on color or
                sound alone.
              </p>
            </div>
          </section>

          <section className="about-technical" aria-labelledby="technical-title">
            <div className="about-technical__heading">
              <span className="about-section__icon" aria-hidden="true">
                <AppIcon name="code" />
              </span>
              <div>
                <h2 id="technical-title">Technical details</h2>
                <p>
                  A small client application with an edge Worker for static delivery and reports.
                </p>
              </div>
            </div>
            <dl>
              {technicalDetails.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="about-note">
            <AppIcon name="info" aria-hidden="true" />
            <div>
              <h2>An educational model, clearly labeled</h2>
              <p>
                Conceptual or fixed-schedule demonstrations are marked in their picker tooltips.
                Full reference implementations are available in Visualize and Compare when an
                implementation is supported.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
