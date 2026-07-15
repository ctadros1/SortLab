import type { AlgorithmMeta, SortEvent } from '../types'

export function CodePanel({ algorithm, event }: { algorithm: AlgorithmMeta; event?: SortEvent }) {
  return (
    <aside className="code-panel" aria-label={`${algorithm.name} pseudocode and explanation`}>
      <div className="panel-heading">
        <div>
          <span className="section-label">Pseudocode</span>
          <h2>{algorithm.name}</h2>
        </div>
        <span className="family-tag">{algorithm.family}</span>
      </div>
      <ol className="pseudocode">
        {algorithm.pseudocode.map((line) => (
          <li className={line.id === event?.codeLine ? 'is-current' : ''} key={line.id}>
            <code>{line.text}</code>
            {line.id === event?.codeLine ? <span className="sr-only">Current line</span> : null}
          </li>
        ))}
      </ol>
      <section className="line-explanation">
        <h3>Current line</h3>
        <p>
          {algorithm.pseudocode.find((line) => line.id === event?.codeLine)?.explanation ??
            'Start the algorithm to connect each visual operation to this pseudocode.'}
        </p>
      </section>
      <section className="complexity-summary">
        <h3>Complexity & traits</h3>
        <dl>
          <div>
            <dt>Best</dt>
            <dd>{algorithm.complexity.best}</dd>
          </div>
          <div>
            <dt>Average</dt>
            <dd>{algorithm.complexity.average}</dd>
          </div>
          <div>
            <dt>Worst</dt>
            <dd>{algorithm.complexity.worst}</dd>
          </div>
          <div>
            <dt>Space</dt>
            <dd>{algorithm.complexity.space}</dd>
          </div>
          <div>
            <dt>Stable</dt>
            <dd>{algorithm.stable ? 'Yes' : 'No'}</dd>
          </div>
          <div>
            <dt>In place</dt>
            <dd>{algorithm.inPlace ? 'Yes' : 'No'}</dd>
          </div>
          <div>
            <dt>Adaptive</dt>
            <dd>{algorithm.adaptive ? 'Yes' : 'No'}</dd>
          </div>
        </dl>
      </section>
    </aside>
  )
}
