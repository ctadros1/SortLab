import type { PlaybackStatus } from '../types'

export function togglePlayback(status: PlaybackStatus): PlaybackStatus {
  if (status === 'running') return 'paused'
  if (status === 'paused' || status === 'idle') return 'running'
  return 'complete'
}

export function clampStep(current: number, amount: number, eventCount: number) {
  return Math.max(-1, Math.min(eventCount - 1, current + amount))
}

export function resetPlayback() {
  return { status: 'idle' as const, eventIndex: -1 }
}
