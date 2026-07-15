import type { SoundDensity, SortSoundEvent } from './audioTypes'

export function densityStride(speed: number, density: SoundDensity) {
  const safeSpeed = Math.max(1, speed)
  const targetNotesPerSecond = density === 'sparse' ? 12 : density === 'balanced' ? 28 : 52
  return Math.max(1, Math.ceil(safeSpeed / targetNotesPerSecond))
}

export function shouldSampleSound(event: SortSoundEvent, density: SoundDensity) {
  if (event.type === 'completion' || event.type === 'pivot') return true
  const stride = densityStride(event.speed, density)
  if (event.type === 'swap') return event.sequence % Math.max(1, Math.floor(stride / 2)) === 0
  return event.sequence % stride === 0
}

export function normalizedVoiceGain(activeVoices: number, enabled = true) {
  if (!enabled) return 1
  return 1 / Math.sqrt(Math.max(1, activeVoices))
}

export function eventAccent(type: SortSoundEvent['type']) {
  if (type === 'swap') return 1.08
  if (type === 'write') return 0.58
  if (type === 'pivot') return 0.78
  if (type === 'completion') return 0.62
  return 1
}
