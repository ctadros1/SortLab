import type { SortEvent } from '../types'
import { AppIcon, type AppIconName } from './Icon'

interface Props {
  event?: SortEvent
  executionMs: number
  steps?: number
}

export function StatsStrip({ event, executionMs, steps = 0 }: Props) {
  const stats = event?.stats
  const items: Array<[string, number | string, AppIconName]> = [
    ['Comparisons', stats?.comparisons ?? 0, 'compare'],
    ['Swaps', stats?.swaps ?? 0, 'swap'],
    ['Writes', stats?.writes ?? 0, 'write'],
    ['Steps', Math.max(0, steps), 'steps'],
    ['Reads', stats?.reads ?? 0, 'reads'],
    ['Auxiliary ops', stats?.auxiliary ?? 0, 'auxiliary'],
    ['Max depth', stats?.maxRecursionDepth ?? 0, 'depth'],
    ['Current phase', event?.phase ?? 'Ready', 'phase'],
  ]
  return (
    <section className="stats-strip" aria-label="Algorithm operation statistics">
      {items.map(([label, value, icon]) => (
        <div
          className={`stat ${label === 'Current phase' ? 'stat--phase' : ''}`}
          data-stat={label.toLowerCase().replaceAll(' ', '-')}
          key={label}
        >
          <AppIcon name={icon} aria-hidden="true" />
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
      <div
        className="stat"
        data-stat="js-execution"
        data-tooltip="Time used to generate operations, excluding animation"
      >
        <AppIcon name="timer" aria-hidden="true" />
        <span>JS execution</span>
        <strong>{executionMs.toFixed(2)} ms</strong>
      </div>
    </section>
  )
}
