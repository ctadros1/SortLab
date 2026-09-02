export function advanceSharedStep(current: number, advance: number, longestEventCount: number) {
  const longestLastIndex = Math.max(0, longestEventCount - 1)
  return Math.min(longestLastIndex, current + advance)
}

export function compareCrossfadeLevels(position: number) {
  const normalized = Math.min(1, Math.max(0, position / 100))
  return {
    first: Math.cos((normalized * Math.PI) / 2),
    second: Math.sin((normalized * Math.PI) / 2),
  }
}

export function compareCrossfadeLabel(position: number) {
  if (position <= 0) return 'First algorithm only'
  if (position >= 100) return 'Second algorithm only'
  if (Math.abs(position - 50) <= 1) return 'Balanced'
  return position < 50 ? 'More first algorithm' : 'More second algorithm'
}

export function synchronizedEventIndex(
  sharedStep: number,
  eventCount: number,
  longestEventCount: number,
) {
  if (eventCount === 0) return -1

  const lastIndex = eventCount - 1
  const longestLastIndex = Math.max(0, longestEventCount - 1)
  if (longestLastIndex === 0) return lastIndex

  // Multiply before dividing so the longest run maps to its exact integer step.
  // Reconstructing shared progress from rounded panel indices can otherwise stall.
  return Math.min(lastIndex, Math.floor((sharedStep * lastIndex) / longestLastIndex))
}
