import { algorithmById } from '../algorithms/registry'
import { CancellationToken } from './control'

interface Request {
  id: number
  algorithms: string[]
  values: number[]
  trials: number
}

const cancellation = new CancellationToken()

function insertion(values: number[]) {
  for (let i = 1; i < values.length; i += 1) {
    const key = values[i]
    let j = i - 1
    while (j >= 0 && values[j] > key) {
      values[j + 1] = values[j]
      j -= 1
    }
    values[j + 1] = key
  }
}

function bubble(values: number[]) {
  for (let end = values.length - 1; end > 0; end -= 1) {
    let changed = false
    for (let i = 0; i < end; i += 1) {
      if (values[i] > values[i + 1]) {
        ;[values[i], values[i + 1]] = [values[i + 1], values[i]]
        changed = true
      }
    }
    if (!changed) return
  }
}

function merge(values: number[]): number[] {
  if (values.length <= 1) return values
  const middle = Math.floor(values.length / 2)
  const left = merge(values.slice(0, middle))
  const right = merge(values.slice(middle))
  const result: number[] = []
  let i = 0
  let j = 0
  while (i < left.length || j < right.length) {
    if (j >= right.length || (i < left.length && left[i] <= right[j])) result.push(left[i++])
    else result.push(right[j++])
  }
  return result
}

function quick(values: number[], left = 0, right = values.length - 1) {
  if (left >= right) return
  const pivot = values[Math.floor((left + right) / 2)]
  let i = left
  let j = right
  while (i <= j) {
    while (values[i] < pivot) i += 1
    while (values[j] > pivot) j -= 1
    if (i <= j) {
      ;[values[i], values[j]] = [values[j], values[i]]
      i += 1
      j -= 1
    }
  }
  quick(values, left, j)
  quick(values, i, right)
}

function sortForBenchmark(id: string, source: number[]) {
  const values = [...source]
  if (id.includes('bubble') || id === 'cocktail' || id === 'gnome' || id === 'odd-even')
    bubble(values)
  else if (id === 'insertion' || id === 'binary-insertion' || id === 'shell') insertion(values)
  else if (id.includes('merge') || id === 'timsort' || id === 'strand') return merge(values)
  else if (id.includes('quick') || id === 'introsort') quick(values)
  else values.sort((a, b) => a - b)
  return values
}

self.onmessage = async (event: MessageEvent<Request | { cancel: true }>) => {
  if ('cancel' in event.data) {
    cancellation.cancel()
    return
  }
  cancellation.reset()
  const { id, algorithms, values, trials } = event.data
  const results: Array<{ id: string; median: number; samples: number[]; skipped?: string }> = []
  for (const algorithmId of algorithms) {
    if (cancellation.isCanceled) break
    const meta = algorithmById.get(algorithmId)
    if (!meta) continue
    if (
      values.length > 5000 &&
      [
        'bubble',
        'bubble-optimized',
        'selection',
        'insertion',
        'cocktail',
        'gnome',
        'odd-even',
        'stooge',
        'slow',
        'bogo',
      ].includes(algorithmId)
    ) {
      results.push({
        id: algorithmId,
        median: 0,
        samples: [],
        skipped: 'Skipped to prevent a quadratic or pathological run at this size.',
      })
      continue
    }
    sortForBenchmark(algorithmId, values)
    const samples: number[] = []
    for (let trial = 0; trial < trials; trial += 1) {
      if (cancellation.isCanceled) break
      const started = performance.now()
      sortForBenchmark(algorithmId, values)
      samples.push(performance.now() - started)
      await new Promise((resolve) => setTimeout(resolve, 0))
    }
    const ordered = [...samples].sort((a, b) => a - b)
    results.push({ id: algorithmId, samples, median: ordered[Math.floor(ordered.length / 2)] ?? 0 })
    self.postMessage({ id, type: 'progress', completed: results.length, total: algorithms.length })
  }
  self.postMessage({ id, type: cancellation.isCanceled ? 'canceled' : 'complete', results })
}
