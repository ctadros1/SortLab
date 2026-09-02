import type { SortEvent } from '../types'
import { getBarDisplayRules, markerKindForEvent, type MarkerKind } from '../ui/visualizer'
import { AppIcon, Diamond } from './Icon'

interface Props {
  values: number[]
  scaleValues?: number[]
  event?: SortEvent
  compact?: boolean
  label?: string
}

function MarkerIcon({ kind }: { kind: MarkerKind }) {
  if (kind === 'pivot') return <Diamond aria-hidden="true" size={14} />
  if (kind === 'compare') return <AppIcon name="compare" aria-hidden="true" size={14} />
  if (kind === 'swap') return <AppIcon name="swap" aria-hidden="true" size={14} />
  if (kind === 'select') return <AppIcon name="algorithm" aria-hidden="true" size={14} />
  if (kind === 'write') return <AppIcon name="write" aria-hidden="true" size={14} />
  return <AppIcon name="check" aria-hidden="true" size={14} />
}

export function BarVisualizer({
  values,
  scaleValues,
  event,
  compact = false,
  label = 'Sorting visualization',
}: Props) {
  const scale = scaleValues?.length ? scaleValues : values
  const minimum = Math.min(...scale)
  const maximum = Math.max(...scale)
  const span = Math.max(1, maximum - minimum)
  const active = new Set(event?.indices ?? [])
  const rules = getBarDisplayRules(values.length, compact)
  const eventMarker = event ? markerKindForEvent(event.type) : null

  return (
    <div
      className={`bar-visualizer ${compact ? 'bar-visualizer--compact' : ''} ${values.length > 20 ? 'bar-visualizer--dense' : ''}`}
      role="img"
      aria-label={`${label}. ${event?.narration ?? 'Ready to sort.'}`}
      style={
        {
          '--visual-minimum': minimum,
          '--visual-maximum': maximum,
          '--marker-headroom': `${rules.markerHeadroom}px`,
          '--value-headroom': `${rules.showValues ? rules.valueHeadroom : 0}px`,
        } as React.CSSProperties
      }
    >
      {values.map((value, index) => {
        const height = 7 + ((value - minimum) / span) * 73
        const isActive = active.has(index)
        const isSorted = event?.type === 'markSorted' && isActive
        const state = isSorted
          ? 'sorted'
          : isActive
            ? event?.type === 'select'
              ? 'select'
              : event?.type === 'write' || event?.type === 'bucket'
                ? 'write'
                : event?.type === 'markSorted'
                  ? 'sorted'
                  : (event?.type ?? 'default')
            : 'default'
        const markers: MarkerKind[] = []
        const showEventMarker = !(compact && event?.type === 'markSorted')
        if (isActive && eventMarker && showEventMarker) markers.push(eventMarker)
        return (
          <div className="bar-slot" data-state={state} key={`${index}-${value}`}>
            <span
              className="bar-track"
              aria-hidden="true"
              style={{ '--bar-height': `${height}%` } as React.CSSProperties}
            >
              <span className="bar-marker-lane">
                {markers.slice(0, 2).map((marker) => (
                  <i className={`bar-marker bar-marker--${marker}`} key={marker}>
                    <MarkerIcon kind={marker} />
                  </i>
                ))}
              </span>
              {rules.showValues ? <span className="bar-value">{value}</span> : null}
              <i className={`sort-bar sort-bar--${state}`} style={{ height: `${height}%` }} />
            </span>
            {rules.showIndices ? <span className="bar-index">{index}</span> : null}
          </div>
        )
      })}
    </div>
  )
}

const legendStates: Array<[MarkerKind, string]> = [
  ['compare', 'Comparing'],
  ['swap', 'Swapping'],
  ['pivot', 'Pivot'],
  ['select', 'Selected minimum'],
  ['write', 'Current write'],
  ['sorted', 'Sorted'],
]

export function VisualLegend() {
  return (
    <div className="legend" aria-label="Visualization state legend">
      {legendStates.map(([state, label]) => (
        <span className="legend-item" key={state}>
          {label}
          <i className={`legend-marker bar-marker--${state}`} aria-hidden="true">
            <MarkerIcon kind={state} />
          </i>
        </span>
      ))}
    </div>
  )
}
