import { mulberry32 } from '../utils/array'

export const sandboxDatasetRegistry = [
  ['random', 'Random', 'Uniformly mixed integer values.'],
  ['nearly-sorted', 'Nearly Sorted', 'Ascending values with a small number of displaced pairs.'],
  ['reversed', 'Reversed', 'Values ordered from largest to smallest.'],
  ['sorted', 'Sorted', 'Values already ordered from smallest to largest.'],
  ['few-unique', 'Few Unique Values', 'A small vocabulary repeated throughout the array.'],
  ['duplicates', 'Many Duplicates', 'Repeated clusters reveal duplicate-key behavior.'],
  ['all-equal', 'All Equal', 'Every value is identical.'],
  ['sawtooth', 'Sawtooth', 'A repeating rising staircase.'],
  ['sine-wave', 'Sine Wave', 'Periodic heights sampled from a sine curve.'],
  ['bell-curve', 'Bell Curve', 'Small edges and a tall center.'],
  ['uniform-distribution', 'Uniform Distribution', 'Even coverage across the key range.'],
  ['normal-distribution', 'Normal Distribution', 'Values concentrated around the mean.'],
  [
    'exponential-distribution',
    'Exponential Distribution',
    'Many small values with a long upper tail.',
  ],
  ['zipf-distribution', 'Zipf Distribution', 'A few values occur much more often than the rest.'],
  ['organ-pipe', 'Organ Pipe', 'Values rise toward the center and fall symmetrically.'],
  ['mountain', 'Mountain', 'A broad ascending then descending slope.'],
  ['valley', 'Valley', 'A descending then ascending slope.'],
  [
    'alternating-high-low',
    'Alternating High and Low',
    'Low and high values alternate across the array.',
  ],
  ['groups', 'Shuffled Blocks', 'Individually ordered blocks appear in mixed order.'],
  ['rotated-sorted', 'Rotated Sorted Array', 'A sorted sequence rotated around one pivot.'],
  ['scrambled-tail', 'Scrambled Tail', 'A sorted prefix followed by a shuffled suffix.'],
  ['scrambled-middle', 'Scrambled Middle', 'Sorted ends surround a shuffled center.'],
  ['quick-killer', 'Quick-Killer Pattern', 'An adversarial alternating pattern for simple pivots.'],
  [
    'median-three-killer',
    'Median-of-Three Killer',
    'A patterned input that frustrates median-of-three choices.',
  ],
  ['timsort-runs', 'Timsort Run Pattern', 'Alternating natural runs exercise adaptive merging.'],
  [
    'radix-friendly',
    'Radix-Friendly Integers',
    'Dense nonnegative keys with repeated digit structure.',
  ],
  ['large-key-range', 'Large Key Range', 'Sparse integers spread across a wide range.'],
  ['small-key-range', 'Small Key Range', 'Many values drawn from a tiny integer range.'],
  ['positive-negative', 'Positive and Negative Values', 'Signed values distributed around zero.'],
  ['duplicate-clusters', 'Duplicate Clusters', 'Long neighboring groups share the same value.'],
] as const

export type SandboxDatasetId = (typeof sandboxDatasetRegistry)[number][0]

function shuffle<T>(values: T[], random: () => number) {
  for (let index = values.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1))
    ;[values[index], values[target]] = [values[target], values[index]]
  }
  return values
}

function rankValues(size: number) {
  return Array.from({ length: size }, (_, index) => index + 1)
}

export function generateSandboxArray(mode: SandboxDatasetId, size: number, seed: number) {
  const random = mulberry32(seed)
  const ranks = rankValues(size)
  if (mode === 'sorted') return ranks
  if (mode === 'reversed') return ranks.reverse()
  if (mode === 'rotated-sorted') {
    const pivot = Math.max(1, Math.floor(size * 0.37))
    return ranks.slice(pivot).concat(ranks.slice(0, pivot))
  }
  if (mode === 'all-equal') return Array(size).fill(50)
  if (mode === 'few-unique' || mode === 'small-key-range')
    return Array.from({ length: size }, () => 1 + Math.floor(random() * 5))
  if (mode === 'duplicates')
    return Array.from({ length: size }, () => 5 + Math.floor(random() * Math.max(3, size / 8)) * 4)
  if (mode === 'duplicate-clusters')
    return Array.from(
      { length: size },
      (_, index) => 8 + Math.floor(index / Math.max(2, size / 12)) * 7,
    )
  if (mode === 'sawtooth') {
    const period = Math.max(4, Math.floor(Math.sqrt(size)))
    return Array.from({ length: size }, (_, index) => 5 + (index % period) * 5)
  }
  if (mode === 'sine-wave')
    return Array.from({ length: size }, (_, index) =>
      Math.round(52 + Math.sin((index / Math.max(1, size - 1)) * Math.PI * 6) * 46),
    )
  if (mode === 'bell-curve' || mode === 'organ-pipe' || mode === 'mountain')
    return Array.from({ length: size }, (_, index) => {
      const centerDistance = Math.abs(index - (size - 1) / 2) / Math.max(1, (size - 1) / 2)
      return Math.round(5 + (1 - centerDistance) * 94)
    })
  if (mode === 'valley')
    return Array.from({ length: size }, (_, index) => {
      const centerDistance = Math.abs(index - (size - 1) / 2) / Math.max(1, (size - 1) / 2)
      return Math.round(5 + centerDistance * 94)
    })
  if (mode === 'uniform-distribution') return shuffle(ranks, random)
  if (mode === 'normal-distribution')
    return Array.from({ length: size }, () => {
      const first = Math.max(Number.EPSILON, random())
      const second = random()
      const standard = Math.sqrt(-2 * Math.log(first)) * Math.cos(2 * Math.PI * second)
      return Math.round(Math.max(1, Math.min(100, 50 + standard * 15)))
    })
  if (mode === 'exponential-distribution')
    return Array.from({ length: size }, () =>
      Math.round(Math.min(100, -Math.log(Math.max(Number.EPSILON, 1 - random())) * 20)),
    )
  if (mode === 'zipf-distribution')
    return Array.from({ length: size }, () =>
      Math.max(1, Math.round(40 / Math.max(1, Math.floor(random() * 12) + 1))),
    )
  if (mode === 'alternating-high-low')
    return Array.from({ length: size }, (_, index) =>
      index % 2 === 0 ? Math.floor(index / 2) + 1 : size - Math.floor(index / 2),
    )
  if (mode === 'groups') {
    const width = Math.max(4, Math.floor(size / 8))
    const groups: number[][] = []
    for (let index = 0; index < size; index += width) groups.push(ranks.slice(index, index + width))
    return shuffle(groups, random).flat()
  }
  if (mode === 'scrambled-tail') {
    const split = Math.floor(size * 0.7)
    return ranks.slice(0, split).concat(shuffle(ranks.slice(split), random))
  }
  if (mode === 'scrambled-middle') {
    const start = Math.floor(size * 0.25)
    const end = Math.floor(size * 0.75)
    return ranks.slice(0, start).concat(shuffle(ranks.slice(start, end), random), ranks.slice(end))
  }
  if (mode === 'quick-killer')
    return Array.from({ length: size }, (_, index) =>
      index % 2 === 0 ? Math.floor(index / 2) + 1 : size - Math.floor(index / 2),
    )
  if (mode === 'median-three-killer') {
    const odds = ranks.filter((value) => value % 2 === 1)
    const evens = ranks.filter((value) => value % 2 === 0)
    return odds.concat(evens)
  }
  if (mode === 'timsort-runs') {
    const width = Math.max(8, Math.floor(size / 10))
    const result: number[] = []
    for (let index = 0; index < size; index += width) {
      const run = ranks.slice(index, index + width)
      result.push(...(Math.floor(index / width) % 2 === 0 ? run : run.reverse()))
    }
    return result
  }
  if (mode === 'radix-friendly')
    return Array.from({ length: size }, () => Math.floor(random() * 1000))
  if (mode === 'large-key-range')
    return Array.from({ length: size }, () => Math.floor(random() * 2_000_001) - 1_000_000)
  if (mode === 'positive-negative')
    return Array.from({ length: size }, () => Math.floor(random() * 2001) - 1000)
  if (mode === 'nearly-sorted') {
    const result = ranks
    for (let index = 0; index < Math.max(1, Math.floor(size * 0.05)); index += 1) {
      const left = Math.floor(random() * size)
      const right = Math.floor(random() * size)
      ;[result[left], result[right]] = [result[right], result[left]]
    }
    return result
  }
  return Array.from({ length: size }, () => 5 + Math.floor(random() * 95))
}
