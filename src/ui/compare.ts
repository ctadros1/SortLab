export function advanceSharedStep(current: number, advance: number, longestEventCount: number) {
  const longestLastIndex = Math.max(0, longestEventCount - 1)
  return Math.min(longestLastIndex, current + advance)
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
