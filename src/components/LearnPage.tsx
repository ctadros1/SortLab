import { useMemo, useState } from 'react'
import { algorithmRegistry, families } from '../algorithms/registry'
import { ComplexityChart } from './ComplexityChart'

export function LearnPage() {
  const [query, setQuery] = useState('')
  const [family, setFamily] = useState('All')
  const [stableOnly, setStableOnly] = useState(false)
  const [inPlaceOnly, setInPlaceOnly] = useState(false)
  const [comparison, setComparison] = useState('all')
  const [selected, setSelected] = useState('quick-hoare')
  const [sortKey, setSortKey] = useState<'name' | 'family' | 'worst'>('name')
  const filtered = useMemo(
    () =>
      algorithmRegistry
        .filter((algorithm) => {
          const text =
            `${algorithm.name} ${algorithm.aliases.join(' ')} ${algorithm.shortDescription}`.toLowerCase()
          return (
            text.includes(query.toLowerCase()) &&
            (family === 'All' || algorithm.family === family) &&
            (!stableOnly || algorithm.stable) &&
            (!inPlaceOnly || algorithm.inPlace) &&
            (comparison === 'all' || algorithm.comparisonBased === (comparison === 'comparison'))
          )
        })
        .sort((a, b) => {
          const left = sortKey === 'worst' ? a.complexity.worst : a[sortKey]
          const right = sortKey === 'worst' ? b.complexity.worst : b[sortKey]
          return left.localeCompare(right)
        }),
    [comparison, family, inPlaceOnly, query, sortKey, stableOnly],
  )
  const detail = algorithmRegistry.find((item) => item.id === selected) ?? algorithmRegistry[0]

  return (
    <main className="page-shell learn-page">
      <header className="page-intro">
        <div>
          <span className="section-label">Algorithm catalog</span>
          <h1>Learn the idea, not just the animation</h1>
        </div>
        <p>
          Filter the catalog, compare traits, then open an algorithm for a worked explanation and
          common mistakes.
        </p>
      </header>
      <section className="catalog-controls" aria-label="Algorithm filters">
        <label>
          <span>Search</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name, alias, or idea"
          />
        </label>
        <label>
          <span>Family</span>
          <select value={family} onChange={(event) => setFamily(event.target.value)}>
            <option>All</option>
            {families.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Type</span>
          <select value={comparison} onChange={(event) => setComparison(event.target.value)}>
            <option value="all">All sorts</option>
            <option value="comparison">Comparison sorts</option>
            <option value="distribution">Non-comparison sorts</option>
          </select>
        </label>
        <label className="switch-row">
          <input
            type="checkbox"
            checked={stableOnly}
            onChange={(event) => setStableOnly(event.target.checked)}
          />
          <span>Stable only</span>
        </label>
        <label className="switch-row">
          <input
            type="checkbox"
            checked={inPlaceOnly}
            onChange={(event) => setInPlaceOnly(event.target.checked)}
          />
          <span>In-place only</span>
        </label>
      </section>
      <div className="catalog-layout">
        <section className="table-wrap" aria-label="Interactive sorting algorithm comparison table">
          <table>
            <thead>
              <tr>
                <th>
                  <button onClick={() => setSortKey('name')}>Algorithm</button>
                </th>
                <th>
                  <button onClick={() => setSortKey('family')}>Family</button>
                </th>
                <th>Best</th>
                <th>Average</th>
                <th>
                  <button onClick={() => setSortKey('worst')}>Worst</button>
                </th>
                <th>Space</th>
                <th>Stable</th>
                <th>In place</th>
                <th>Adaptive</th>
                <th>Comparison</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((algorithm) => (
                <tr
                  key={algorithm.id}
                  className={selected === algorithm.id ? 'is-selected' : ''}
                  onClick={() => setSelected(algorithm.id)}
                >
                  <th scope="row">
                    <button onClick={() => setSelected(algorithm.id)}>{algorithm.name}</button>
                  </th>
                  <td>{algorithm.family}</td>
                  <td>{algorithm.complexity.best}</td>
                  <td>{algorithm.complexity.average}</td>
                  <td>{algorithm.complexity.worst}</td>
                  <td>{algorithm.complexity.space}</td>
                  <td>{algorithm.stable ? 'Yes' : 'No'}</td>
                  <td>{algorithm.inPlace ? 'Yes' : 'No'}</td>
                  <td>{algorithm.adaptive ? 'Yes' : 'No'}</td>
                  <td>{algorithm.comparisonBased ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="table-count">
            Showing {filtered.length} of {algorithmRegistry.length} algorithms.
          </p>
        </section>
        <aside className="algorithm-detail">
          <span className="family-tag">{detail.family}</span>
          <h2>{detail.name}</h2>
          <p className="detail-lead">{detail.shortDescription}</p>
          {detail.warning ? <div className="warning">{detail.warning}</div> : null}
          {detail.approximation ? (
            <div className="approximation-note">
              Educational approximation—see implementation notes.
            </div>
          ) : null}
          <h3>Central idea</h3>
          <p>{detail.centralIdea}</p>
          <h3>Step by step</h3>
          <ol>
            {detail.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <h3>Worked example</h3>
          <p>{detail.example}</p>
          <h3>Use it when</h3>
          <p>{detail.useCases}</p>
          <h3>Tradeoffs</h3>
          <p>{detail.disadvantages}</p>
          <h3>Related algorithms</h3>
          <p>{detail.related}</p>
          <h3>When not to use it</h3>
          <p>{detail.avoidWhen}</p>
          <h3>Implementation notes</h3>
          <p>{detail.implementationNotes}</p>
          <h3>Common student mistakes</h3>
          <p>{detail.studentMistakes}</p>
          <h3>Input rules</h3>
          <p>{detail.restrictions}</p>
        </aside>
      </div>
      <ComplexityChart />
    </main>
  )
}
