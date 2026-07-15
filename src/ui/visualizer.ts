import type { SortEventType } from '../types'

export type MarkerKind = 'compare' | 'swap' | 'pivot' | 'sorted' | 'select' | 'write' | 'range'

export function getBarDisplayRules(count: number, compact = false, viewportWidth = 1200) {
  return {
    showValues: count <= (compact ? 20 : viewportWidth <= 420 ? 18 : 48),
    showIndices: count <= (compact ? 24 : viewportWidth <= 420 ? 24 : 56),
    markerHeadroom: 26,
    valueHeadroom: count <= (compact ? 20 : 48) ? 18 : 0,
  }
}

export function markerKindForEvent(type: SortEventType): MarkerKind | null {
  if (type === 'compare') return 'compare'
  if (type === 'swap') return 'swap'
  if (type === 'pivot') return 'pivot'
  if (type === 'markSorted') return 'sorted'
  if (type === 'select') return 'select'
  if (type === 'write' || type === 'merge' || type === 'bucket') return 'write'
  if (type === 'range' || type === 'heapify') return 'range'
  return null
}

export function pseudocodeTokens(line: string) {
  return line
    .split(
      /\b(for|each|if|while|repeat|until|return|else|procedure|loop|swap|write|pivot|minimum|maximum|range|merge)\b/gi,
    )
    .filter(Boolean)
}

export function nextSwitchState(current: boolean) {
  return !current
}
