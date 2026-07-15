import type { PitchMode } from './audioTypes'

const SCALE_INTERVALS: Record<Exclude<PitchMode, 'continuous'>, number[]> = {
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  pentatonic: [0, 2, 4, 7, 9],
  major: [0, 2, 4, 5, 7, 9, 11],
}

export function clampFrequency(value: number, minimum: number, maximum: number) {
  const safeMinimum = Number.isFinite(minimum) ? Math.max(20, minimum) : 120
  const safeMaximum = Number.isFinite(maximum) ? Math.max(safeMinimum, maximum) : 1212
  return Math.min(safeMaximum, Math.max(safeMinimum, Number.isFinite(value) ? value : safeMinimum))
}

export function quantizeFrequency(frequency: number, mode: PitchMode) {
  if (mode === 'continuous') return frequency
  const midi = 69 + 12 * Math.log2(Math.max(1, frequency) / 440)
  const octave = Math.floor(midi / 12)
  const pitchClass = ((midi % 12) + 12) % 12
  const intervals = SCALE_INTERVALS[mode]
  let nearest = intervals[0]
  let distance = Number.POSITIVE_INFINITY
  for (const interval of intervals) {
    const candidateDistance = Math.abs(interval - pitchClass)
    if (candidateDistance < distance) {
      nearest = interval
      distance = candidateDistance
    }
  }
  const quantizedMidi = octave * 12 + nearest
  return 440 * 2 ** ((quantizedMidi - 69) / 12)
}

export function valueToFrequency(
  value: number,
  datasetMinimum: number,
  datasetMaximum: number,
  minimumFrequency = 120,
  maximumFrequency = 1212,
  mode: PitchMode = 'continuous',
) {
  const low = Math.min(minimumFrequency, maximumFrequency)
  const high = Math.max(minimumFrequency, maximumFrequency)
  if (!Number.isFinite(value)) return low
  if (!Number.isFinite(datasetMinimum) || !Number.isFinite(datasetMaximum)) return low
  if (datasetMaximum === datasetMinimum) return clampFrequency((low + high) / 2, low, high)
  const ratio = Math.min(
    1,
    Math.max(0, (value - datasetMinimum) / (datasetMaximum - datasetMinimum)),
  )
  const continuous = low * (high / low) ** ratio
  return clampFrequency(quantizeFrequency(continuous, mode), low, high)
}

export function datasetRange(values: number[]) {
  if (values.length === 0) return { minimum: 0, maximum: 0 }
  let minimum = values[0]
  let maximum = values[0]
  for (let index = 1; index < values.length; index += 1) {
    const value = values[index]
    if (value < minimum) minimum = value
    if (value > maximum) maximum = value
  }
  return { minimum, maximum }
}
