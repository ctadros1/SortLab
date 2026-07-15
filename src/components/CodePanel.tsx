import { useId, useState, type ReactNode } from 'react'
import type { AlgorithmMeta, SortEvent } from '../types'
import { pseudocodeTokens } from '../ui/visualizer'
import { AlgorithmIcon, AppIcon } from './Icon'
import { MathNotation } from './MathNotation'

const keywords = new Set([
  'for',
  'each',
  'if',
  'while',
  'repeat',
  'until',
  'return',
  'else',
  'procedure',
  'loop',
  'swap',
  'write',
  'pivot',
  'minimum',
  'maximum',
  'range',
  'merge',
])

function SyntaxLine({ text }: { text: string }) {
  const parts: ReactNode[] = pseudocodeTokens(text).map((part, index) =>
    keywords.has(part.toLowerCase()) ? (
      <span className="syntax-keyword" key={index}>
        {part}
      </span>
    ) : (
      <span key={index}>{part}</span>
    ),
  )
  return (
    <code aria-label={text}>
      <span aria-hidden="true">{parts}</span>
    </code>
  )
}

export function CodePanel({ algorithm, event }: { algorithm: AlgorithmMeta; event?: SortEvent }) {
  const [tab, setTab] = useState<'code' | 'explain'>('code')
  const id = useId().replace(/:/g, '')
  const activeLine = algorithm.pseudocode.find((line) => line.id === event?.codeLine)
  return (
    <aside className="code-panel" aria-label={`${algorithm.name} code and explanation`}>
      <div className="panel-heading">
        <div>
          <span className="section-label">Algorithm guide</span>
          <h2>
            <AlgorithmIcon name={algorithm.icon} aria-hidden="true" /> {algorithm.name}
          </h2>
        </div>
        <span className="family-tag">{algorithm.family}</span>
      </div>
      <div className="code-tabs" role="tablist" aria-label="Algorithm guide views">
        <button
          type="button"
          role="tab"
          id={`${id}-code-tab`}
          aria-selected={tab === 'code'}
          aria-controls={`${id}-code-panel`}
          onClick={() => setTab('code')}
        >
          <AppIcon name="code" aria-hidden="true" /> Pseudocode
        </button>
        <button
          type="button"
          role="tab"
          id={`${id}-explain-tab`}
          aria-selected={tab === 'explain'}
          aria-controls={`${id}-explain-panel`}
          onClick={() => setTab('explain')}
        >
          <AppIcon name="explain" aria-hidden="true" /> Explain
        </button>
      </div>

      {tab === 'code' ? (
        <div
          className="code-tab-panel"
          role="tabpanel"
          id={`${id}-code-panel`}
          aria-labelledby={`${id}-code-tab`}
        >
          <ol className="pseudocode">
            {algorithm.pseudocode.map((line, index) => {
              const current = line.id === event?.codeLine
              return (
                <li className={current ? 'is-current' : ''} key={line.id} aria-current={current}>
                  <span className="code-pointer" aria-hidden="true">
                    {current ? '›' : ''}
                  </span>
                  <span className="code-line-number" aria-hidden="true">
                    {index + 1}
                  </span>
                  <SyntaxLine text={line.text} />
                </li>
              )
            })}
          </ol>
          <section className="line-explanation" aria-live="polite">
            <h3>
              <AppIcon name="narration" aria-hidden="true" /> Current line
            </h3>
            <p>
              {activeLine?.explanation ??
                'Start the algorithm to connect each visual operation to this pseudocode.'}
            </p>
            <span className="sr-only">
              {activeLine ? `Current pseudocode line: ${activeLine.text}` : 'No active line yet.'}
            </span>
          </section>
        </div>
      ) : (
        <div
          className="explain-tab-panel"
          role="tabpanel"
          id={`${id}-explain-panel`}
          aria-labelledby={`${id}-explain-tab`}
        >
          <section>
            <h3>Plain-language summary</h3>
            <p>{algorithm.centralIdea}</p>
          </section>
          <div className="explain-status-grid">
            <section>
              <span>Current phase</span>
              <strong>{event?.phase ?? 'Ready'}</strong>
            </section>
            <section>
              <span>Current operation</span>
              <strong>{event?.narration ?? 'Waiting to start'}</strong>
            </section>
          </div>
          <section>
            <h3>Important invariant</h3>
            <p>{algorithm.invariant}</p>
          </section>
          <section>
            <h3>What to notice</h3>
            <p>{algorithm.notice}</p>
          </section>
          <section>
            <h3>Worked example</h3>
            <p>{algorithm.example}</p>
          </section>
          <section>
            <h3>Common mistake</h3>
            <p>{algorithm.studentMistakes}</p>
          </section>
        </div>
      )}

      <section className="complexity-summary">
        <h3>
          <AppIcon name="complexity" aria-hidden="true" /> Complexity & traits
        </h3>
        <dl className="complexity-grid">
          {(
            [
              ['Best', algorithm.complexity.best],
              ['Average', algorithm.complexity.average],
              ['Worst', algorithm.complexity.worst],
              ['Space', algorithm.complexity.space],
            ] as const
          ).map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>
                <MathNotation value={value} />
              </dd>
            </div>
          ))}
        </dl>
        <div className="trait-badges" aria-label="Algorithm traits">
          <span data-positive={algorithm.stable}>Stable: {algorithm.stable ? 'Yes' : 'No'}</span>
          <span data-positive={algorithm.inPlace}>
            In place: {algorithm.inPlace ? 'Yes' : 'No'}
          </span>
          <span data-positive={algorithm.adaptive}>
            Adaptive: {algorithm.adaptive ? 'Yes' : 'No'}
          </span>
        </div>
      </section>
    </aside>
  )
}
