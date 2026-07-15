import type { SortEvent } from '../types'

interface Props {
  values: number[]
  event?: SortEvent
  compact?: boolean
  label?: string
}

export function BarVisualizer({
  values,
  event,
  compact = false,
  label = 'Sorting visualization',
}: Props) {
  const minimum = Math.min(...values)
  const maximum = Math.max(...values)
  const span = Math.max(1, maximum - minimum)
  const active = new Set(event?.indices ?? [])
  const showValues = values.length <= (compact ? 20 : 48)
  const status = event?.type ?? 'default'

  return (
    <div
      className={`bar-visualizer ${compact ? 'bar-visualizer--compact' : ''} ${values.length > 20 ? 'bar-visualizer--dense' : ''}`}
      role="img"
      aria-label={`${label}. ${event?.narration ?? 'Ready to sort.'}`}
    >
      {values.map((value, index) => {
        const height = 8 + ((value - minimum) / span) * 92
        const isActive = active.has(index)
        const isSorted = event?.type === 'markSorted' || (event?.type === 'merge' && isActive)
        const state = isSorted
          ? 'sorted'
          : isActive
            ? status
            : event?.activeRange && index >= event.activeRange[0] && index <= event.activeRange[1]
              ? 'range'
              : 'default'
        return (
          <div className="bar-slot" key={`${index}-${value}`}>
            {showValues ? <span className="bar-value">{value}</span> : null}
            <div
              className={`sort-bar sort-bar--${state}`}
              style={{ height: `${height}%` }}
              aria-hidden="true"
            >
              {isActive ? (
                <span className="bar-marker">
                  {state === 'pivot'
                    ? '◆'
                    : state === 'compare'
                      ? '○'
                      : state === 'swap'
                        ? '×'
                        : '✓'}
                </span>
              ) : null}
            </div>
            {showValues ? <span className="bar-index">{index}</span> : null}
          </div>
        )
      })}
    </div>
  )
}

export function VisualLegend() {
  const states = [
    ['compare', 'Comparing', '○'],
    ['swap', 'Swapping', '×'],
    ['pivot', 'Pivot / selected', '◆'],
    ['range', 'Active range', '—'],
    ['merge', 'Merged / written', '+'],
    ['sorted', 'Sorted', '✓'],
  ]
  return (
    <div className="legend" aria-label="Visualization state legend">
      {states.map(([state, label, marker]) => (
        <span className="legend-item" key={state}>
          <i className={`legend-swatch sort-bar--${state}`} aria-hidden="true" />
          {label} <b aria-hidden="true">{marker}</b>
        </span>
      ))}
    </div>
  )
}
