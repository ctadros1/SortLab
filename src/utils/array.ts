import type { DatasetMode } from '../types'

export function mulberry32(seed: number) {
  let value = seed >>> 0
  return () => {
    value += 0x6d2b79f5
    let next = value
    next = Math.imul(next ^ (next >>> 15), next | 1)
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61)
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296
  }
}

export function generateArray(mode: DatasetMode, size: number, seed: number): number[] {
  const random = mulberry32(seed)
  const values = Array.from({ length: size }, (_, index) => {
    if (mode === 'few-unique') return 10 + Math.floor(random() * 5) * 20
    if (mode === 'duplicates') return 5 + Math.floor(random() * Math.max(3, size / 3)) * 3
    if (mode === 'sawtooth') return 10 + (index % Math.max(4, Math.floor(size / 5))) * 12
    return 5 + Math.floor(random() * 95)
  })
  if (mode === 'sorted') return [...values].sort((a, b) => a - b)
  if (mode === 'reversed') return [...values].sort((a, b) => b - a)
  if (mode === 'nearly-sorted') {
    const sorted = [...values].sort((a, b) => a - b)
    const swaps = Math.max(1, Math.floor(size * 0.08))
    for (let i = 0; i < swaps; i += 1) {
      const a = Math.floor(random() * size)
      const b = Math.floor(random() * size)
      ;[sorted[a], sorted[b]] = [sorted[b], sorted[a]]
    }
    return sorted
  }
  if (mode === 'groups') {
    const sorted = [...values].sort((a, b) => a - b)
    const width = Math.max(2, Math.floor(size / 4))
    const groups: number[][] = []
    for (let i = 0; i < sorted.length; i += width) groups.push(sorted.slice(i, i + width))
    return groups.sort(() => random() - 0.5).flat()
  }
  return values
}

export function parseCustomInput(value: string, max = 120): number[] {
  if (!value.trim()) throw new Error('Enter at least five comma-separated integers.')
  const parts = value.split(',').map((part) => part.trim())
  if (parts.some((part) => !/^-?\d+$/.test(part))) {
    throw new Error('Use integers only, separated by commas.')
  }
  const result = parts.map(Number)
  if (result.length < 5) throw new Error('Use at least five values so the steps are meaningful.')
  if (result.length > max) throw new Error(`Use no more than ${max} values in visualization mode.`)
  if (result.some((number) => !Number.isSafeInteger(number))) {
    throw new Error('Every value must be a safe integer.')
  }
  return result
}

export function isSorted(values: number[]) {
  return values.every((value, index) => index === 0 || values[index - 1] <= value)
}

export function sameMultiset(left: number[], right: number[]) {
  if (left.length !== right.length) return false
  const counts = new Map<number, number>()
  left.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1))
  right.forEach((value) => counts.set(value, (counts.get(value) ?? 0) - 1))
  return [...counts.values()].every((count) => count === 0)
}
