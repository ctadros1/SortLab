import type { SortEvent } from '../types'

export function StatsStrip({ event, executionMs }: { event?: SortEvent; executionMs: number }) {
  const stats = event?.stats
  const items = [
    ['Comparisons', stats?.comparisons ?? 0],
    ['Swaps', stats?.swaps ?? 0],
    ['Writes', stats?.writes ?? 0],
    ['Reads', stats?.reads ?? 0],
    ['Auxiliary ops', stats?.auxiliary ?? 0],
    ['Max depth', stats?.maxRecursionDepth ?? 0],
  ]
  return (
    <section className="stats-strip" aria-label="Algorithm operation statistics">
      {items.map(([label, value]) => (
        <div className="stat" key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
      <div className="stat stat--phase">
        <span>Phase</span>
        <strong>{event?.phase ?? 'Ready'}</strong>
      </div>
      <div className="stat" title="Time used to generate operations, excluding animation">
        <span>JS execution</span>
        <strong>{executionMs.toFixed(2)} ms</strong>
      </div>
    </section>
  )
}
