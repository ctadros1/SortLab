import type { SortEvent, SortStats } from '../types'
import { isSorted } from '../utils/array'

export type SortGenerator = (input: number[]) => Generator<SortEvent, number[]>

class SortContext {
  values: number[]
  stats: SortStats = {
    comparisons: 0,
    swaps: 0,
    writes: 0,
    reads: 0,
    auxiliary: 0,
    recursionDepth: 0,
    maxRecursionDepth: 0,
  }

  constructor(input: number[]) {
    this.values = [...input]
  }

  event(
    type: SortEvent['type'],
    indices: number[],
    codeLine: string,
    narration: string,
    phase: string,
    activeRange?: [number, number],
  ): SortEvent {
    return {
      type,
      indices,
      codeLine,
      narration,
      phase,
      activeRange,
      array: [...this.values],
      stats: { ...this.stats },
    }
  }

  compare(a: number, b: number, line: string, phase = 'Comparing') {
    this.stats.comparisons += 1
    this.stats.reads += 2
    return this.event(
      'compare',
      [a, b],
      line,
      `Compare ${this.values[a]} at index ${a} with ${this.values[b]} at index ${b}.`,
      phase,
    )
  }

  swap(a: number, b: number, line: string, phase = 'Swapping') {
    const left = this.values[a]
    const right = this.values[b]
    ;[this.values[a], this.values[b]] = [right, left]
    this.stats.swaps += 1
    this.stats.reads += 2
    this.stats.writes += 2
    return this.event('swap', [a, b], line, `Swap ${left} and ${right}.`, phase)
  }

  write(index: number, value: number, line: string, phase = 'Writing') {
    const previous = this.values[index]
    this.values[index] = value
    this.stats.writes += 1
    this.stats.reads += 1
    return this.event(
      'write',
      [index],
      line,
      `Write ${value} at index ${index}, replacing ${previous}.`,
      phase,
    )
  }

  auxiliary(count = 1) {
    this.stats.auxiliary += count
  }

  enterRecursion() {
    this.stats.recursionDepth += 1
    this.stats.maxRecursionDepth = Math.max(this.stats.maxRecursionDepth, this.stats.recursionDepth)
  }

  leaveRecursion() {
    this.stats.recursionDepth = Math.max(0, this.stats.recursionDepth - 1)
  }
}

function* finish(ctx: SortContext, line = 'done'): Generator<SortEvent, number[]> {
  if (!isSorted(ctx.values)) throw new Error('Algorithm completed without producing sorted output.')
  yield ctx.event(
    'markSorted',
    ctx.values.map((_, index) => index),
    line,
    'Every value is now in ascending order.',
    'Complete',
  )
  return [...ctx.values]
}

export function* bubbleSort(input: number[]): Generator<SortEvent, number[]> {
  const ctx = new SortContext(input)
  for (let end = ctx.values.length - 1; end > 0; end -= 1) {
    for (let i = 0; i < end; i += 1) {
      yield ctx.compare(i, i + 1, 'compare-adjacent', 'Bubble pass')
      if (ctx.values[i] > ctx.values[i + 1]) yield ctx.swap(i, i + 1, 'swap-adjacent')
    }
    yield ctx.event(
      'markSorted',
      [end],
      'finish-pass',
      `${ctx.values[end]} is finalized.`,
      'Finalizing',
    )
  }
  return yield* finish(ctx)
}

export function* optimizedBubbleSort(input: number[]): Generator<SortEvent, number[]> {
  const ctx = new SortContext(input)
  for (let end = ctx.values.length - 1; end > 0; end -= 1) {
    let swapped = false
    for (let i = 0; i < end; i += 1) {
      yield ctx.compare(i, i + 1, 'compare-adjacent', 'Optimized pass')
      if (ctx.values[i] > ctx.values[i + 1]) {
        yield ctx.swap(i, i + 1, 'swap-adjacent')
        swapped = true
      }
    }
    if (!swapped) {
      yield ctx.event(
        'note',
        [],
        'stop-if-no-swaps',
        'No swaps occurred, so the array is sorted.',
        'Early exit',
      )
      break
    }
  }
  return yield* finish(ctx)
}

export function* selectionSort(input: number[]): Generator<SortEvent, number[]> {
  const ctx = new SortContext(input)
  for (let start = 0; start < ctx.values.length - 1; start += 1) {
    let minimum = start
    yield ctx.event(
      'select',
      [minimum],
      'set-minimum',
      `Treat ${ctx.values[minimum]} as the current minimum.`,
      'Selecting',
    )
    for (let i = start + 1; i < ctx.values.length; i += 1) {
      yield ctx.compare(minimum, i, 'scan-unsorted', 'Scanning for minimum')
      if (ctx.values[i] < ctx.values[minimum]) minimum = i
    }
    if (minimum !== start) yield ctx.swap(start, minimum, 'place-minimum', 'Placing minimum')
    yield ctx.event(
      'markSorted',
      [start],
      'finalize-position',
      `${ctx.values[start]} is finalized.`,
      'Finalizing',
    )
  }
  return yield* finish(ctx)
}

function* insertionRange(
  ctx: SortContext,
  start: number,
  end: number,
  gap = 1,
): Generator<SortEvent> {
  for (let i = start + gap; i <= end; i += 1) {
    const value = ctx.values[i]
    let j = i
    while (j >= start + gap) {
      yield ctx.compare(j - gap, j, 'compare-key', gap === 1 ? 'Inserting' : `Gap ${gap}`)
      if (ctx.values[j - gap] <= value) break
      yield ctx.write(j, ctx.values[j - gap], 'shift-right', gap === 1 ? 'Shifting' : `Gap ${gap}`)
      j -= gap
    }
    if (j !== i) yield ctx.write(j, value, 'insert-key', 'Placing key')
  }
}

export function* insertionSort(input: number[]): Generator<SortEvent, number[]> {
  const ctx = new SortContext(input)
  yield* insertionRange(ctx, 0, ctx.values.length - 1)
  return yield* finish(ctx)
}

export function* binaryInsertionSort(input: number[]): Generator<SortEvent, number[]> {
  const ctx = new SortContext(input)
  for (let i = 1; i < ctx.values.length; i += 1) {
    const value = ctx.values[i]
    let low = 0
    let high = i
    while (low < high) {
      const middle = Math.floor((low + high) / 2)
      yield ctx.compare(middle, i, 'binary-compare', 'Binary search')
      if (value < ctx.values[middle]) high = middle
      else low = middle + 1
    }
    for (let j = i; j > low; j -= 1)
      yield ctx.write(j, ctx.values[j - 1], 'shift-right', 'Shifting')
    if (low !== i) yield ctx.write(low, value, 'insert-key', 'Placing key')
  }
  return yield* finish(ctx)
}

export function* cocktailSort(input: number[]): Generator<SortEvent, number[]> {
  const ctx = new SortContext(input)
  let start = 0
  let end = ctx.values.length - 1
  let swapped = true
  while (swapped) {
    swapped = false
    for (let i = start; i < end; i += 1) {
      yield ctx.compare(i, i + 1, 'forward-compare', 'Forward sweep')
      if (ctx.values[i] > ctx.values[i + 1]) {
        yield ctx.swap(i, i + 1, 'forward-swap')
        swapped = true
      }
    }
    if (!swapped) break
    swapped = false
    end -= 1
    for (let i = end; i > start; i -= 1) {
      yield ctx.compare(i - 1, i, 'backward-compare', 'Backward sweep')
      if (ctx.values[i - 1] > ctx.values[i]) {
        yield ctx.swap(i - 1, i, 'backward-swap')
        swapped = true
      }
    }
    start += 1
  }
  return yield* finish(ctx)
}

export function* gnomeSort(input: number[]): Generator<SortEvent, number[]> {
  const ctx = new SortContext(input)
  let index = 1
  while (index < ctx.values.length) {
    yield ctx.compare(index - 1, index, 'compare-neighbors', 'Walking')
    if (ctx.values[index - 1] <= ctx.values[index]) index += 1
    else {
      yield ctx.swap(index - 1, index, 'swap-and-step-back')
      index = Math.max(1, index - 1)
    }
  }
  return yield* finish(ctx)
}

export function* combSort(input: number[]): Generator<SortEvent, number[]> {
  const ctx = new SortContext(input)
  let gap = ctx.values.length
  let swapped = true
  while (gap > 1 || swapped) {
    gap = Math.max(1, Math.floor(gap / 1.3))
    swapped = false
    for (let i = 0; i + gap < ctx.values.length; i += 1) {
      yield ctx.compare(i, i + gap, 'compare-gap', `Gap ${gap}`)
      if (ctx.values[i] > ctx.values[i + gap]) {
        yield ctx.swap(i, i + gap, 'swap-gap', `Gap ${gap}`)
        swapped = true
      }
    }
  }
  return yield* finish(ctx)
}

export function* oddEvenSort(input: number[]): Generator<SortEvent, number[]> {
  const ctx = new SortContext(input)
  let sorted = false
  while (!sorted) {
    sorted = true
    for (const parity of [1, 0]) {
      for (let i = parity; i + 1 < ctx.values.length; i += 2) {
        yield ctx.compare(
          i,
          i + 1,
          parity ? 'odd-phase' : 'even-phase',
          parity ? 'Odd phase' : 'Even phase',
        )
        if (ctx.values[i] > ctx.values[i + 1]) {
          yield ctx.swap(i, i + 1, 'compare-exchange')
          sorted = false
        }
      }
    }
  }
  return yield* finish(ctx)
}

function* mergeRanges(
  ctx: SortContext,
  left: number,
  middle: number,
  right: number,
): Generator<SortEvent> {
  const merged: number[] = []
  let i = left
  let j = middle + 1
  ctx.auxiliary(right - left + 1)
  yield ctx.event(
    'range',
    [],
    'select-ranges',
    `Merge ranges ${left}–${middle} and ${middle + 1}–${right}.`,
    'Merging',
    [left, right],
  )
  while (i <= middle && j <= right) {
    yield ctx.compare(i, j, 'compare-fronts', 'Merging')
    if (ctx.values[i] <= ctx.values[j]) merged.push(ctx.values[i++])
    else merged.push(ctx.values[j++])
  }
  while (i <= middle) merged.push(ctx.values[i++])
  while (j <= right) merged.push(ctx.values[j++])
  for (let offset = 0; offset < merged.length; offset += 1) {
    yield ctx.write(left + offset, merged[offset], 'copy-back', 'Merging')
  }
  yield ctx.event(
    'merge',
    Array.from({ length: right - left + 1 }, (_, k) => left + k),
    'range-merged',
    'The two ranges are now one sorted range.',
    'Merged',
    [left, right],
  )
}

export function* mergeSort(input: number[]): Generator<SortEvent, number[]> {
  const ctx = new SortContext(input)
  function* sort(left: number, right: number): Generator<SortEvent> {
    if (left >= right) return
    ctx.enterRecursion()
    const middle = Math.floor((left + right) / 2)
    yield* sort(left, middle)
    yield* sort(middle + 1, right)
    yield* mergeRanges(ctx, left, middle, right)
    ctx.leaveRecursion()
  }
  yield* sort(0, ctx.values.length - 1)
  return yield* finish(ctx)
}

export function* bottomUpMergeSort(input: number[]): Generator<SortEvent, number[]> {
  const ctx = new SortContext(input)
  for (let width = 1; width < ctx.values.length; width *= 2) {
    for (let left = 0; left < ctx.values.length; left += width * 2) {
      const middle = Math.min(left + width - 1, ctx.values.length - 1)
      const right = Math.min(left + width * 2 - 1, ctx.values.length - 1)
      if (middle < right) yield* mergeRanges(ctx, left, middle, right)
    }
  }
  return yield* finish(ctx)
}

type PivotMode = 'lomuto' | 'hoare' | 'randomized' | 'three-way'

function quickGenerator(input: number[], mode: PivotMode): Generator<SortEvent, number[]> {
  return (function* () {
    const ctx = new SortContext(input)
    function* lomuto(left: number, right: number): Generator<SortEvent> {
      if (left >= right) return
      ctx.enterRecursion()
      if (mode === 'randomized') {
        const pivotIndex =
          left + (Math.abs(ctx.values[left] * 31 + right * 17) % (right - left + 1))
        if (pivotIndex !== right)
          yield ctx.swap(pivotIndex, right, 'choose-random-pivot', 'Choosing pivot')
      }
      const pivot = ctx.values[right]
      yield ctx.event(
        'pivot',
        [right],
        'choose-pivot',
        `Use ${pivot} as the pivot.`,
        'Partitioning',
        [left, right],
      )
      let boundary = left
      for (let i = left; i < right; i += 1) {
        yield ctx.compare(i, right, 'compare-pivot', 'Partitioning')
        if (ctx.values[i] <= pivot) {
          if (i !== boundary) yield ctx.swap(i, boundary, 'move-left', 'Partitioning')
          boundary += 1
        }
      }
      if (boundary !== right) yield ctx.swap(boundary, right, 'place-pivot', 'Placing pivot')
      yield* lomuto(left, boundary - 1)
      yield* lomuto(boundary + 1, right)
      ctx.leaveRecursion()
    }
    function* hoare(left: number, right: number): Generator<SortEvent> {
      if (left >= right) return
      ctx.enterRecursion()
      const pivotIndex = Math.floor((left + right) / 2)
      const pivot = ctx.values[pivotIndex]
      yield ctx.event(
        'pivot',
        [pivotIndex],
        'choose-pivot',
        `Use ${pivot} as the pivot value.`,
        'Partitioning',
        [left, right],
      )
      let i = left - 1
      let j = right + 1
      while (true) {
        do i += 1
        while (ctx.values[i] < pivot)
        do j -= 1
        while (ctx.values[j] > pivot)
        yield ctx.compare(i, j, 'scan-inward', 'Partitioning')
        if (i >= j) {
          yield* hoare(left, j)
          yield* hoare(j + 1, right)
          ctx.leaveRecursion()
          return
        }
        yield ctx.swap(i, j, 'swap-misplaced', 'Partitioning')
      }
    }
    function* threeWay(left: number, right: number): Generator<SortEvent> {
      if (left >= right) return
      ctx.enterRecursion()
      const pivot = ctx.values[left]
      let low = left
      let i = left + 1
      let high = right
      yield ctx.event(
        'pivot',
        [left],
        'choose-pivot',
        `Group values around pivot ${pivot}.`,
        'Three-way partition',
        [left, right],
      )
      while (i <= high) {
        yield ctx.compare(left, i, 'compare-pivot', 'Three-way partition')
        if (ctx.values[i] < pivot) {
          yield ctx.swap(low, i, 'move-less')
          low += 1
          i += 1
        } else if (ctx.values[i] > pivot) {
          yield ctx.swap(i, high, 'move-greater')
          high -= 1
        } else i += 1
      }
      yield* threeWay(left, low - 1)
      yield* threeWay(high + 1, right)
      ctx.leaveRecursion()
    }
    if (mode === 'hoare') yield* hoare(0, ctx.values.length - 1)
    else if (mode === 'three-way') yield* threeWay(0, ctx.values.length - 1)
    else yield* lomuto(0, ctx.values.length - 1)
    return yield* finish(ctx)
  })()
}

export const quickSort: SortGenerator = (input) => quickGenerator(input, 'hoare')
export const lomutoQuickSort: SortGenerator = (input) => quickGenerator(input, 'lomuto')
export const randomizedQuickSort: SortGenerator = (input) => quickGenerator(input, 'randomized')
export const threeWayQuickSort: SortGenerator = (input) => quickGenerator(input, 'three-way')

function* heapify(ctx: SortContext, size: number, root: number): Generator<SortEvent> {
  let largest = root
  const left = root * 2 + 1
  const right = left + 1
  yield ctx.event(
    'heapify',
    [root],
    'select-root',
    `Restore heap order below index ${root}.`,
    'Heapifying',
    [0, size - 1],
  )
  if (left < size) {
    yield ctx.compare(largest, left, 'compare-left-child', 'Heapifying')
    if (ctx.values[left] > ctx.values[largest]) largest = left
  }
  if (right < size) {
    yield ctx.compare(largest, right, 'compare-right-child', 'Heapifying')
    if (ctx.values[right] > ctx.values[largest]) largest = right
  }
  if (largest !== root) {
    yield ctx.swap(root, largest, 'swap-with-largest', 'Heapifying')
    yield* heapify(ctx, size, largest)
  }
}

export function* heapSort(input: number[]): Generator<SortEvent, number[]> {
  const ctx = new SortContext(input)
  for (let i = Math.floor(ctx.values.length / 2) - 1; i >= 0; i -= 1)
    yield* heapify(ctx, ctx.values.length, i)
  for (let end = ctx.values.length - 1; end > 0; end -= 1) {
    yield ctx.swap(0, end, 'extract-maximum', 'Extracting maximum')
    yield ctx.event(
      'markSorted',
      [end],
      'finalize-maximum',
      `${ctx.values[end]} is finalized.`,
      'Finalizing',
    )
    yield* heapify(ctx, end, 0)
  }
  return yield* finish(ctx)
}

export function* shellSort(input: number[]): Generator<SortEvent, number[]> {
  const ctx = new SortContext(input)
  for (let gap = Math.floor(ctx.values.length / 2); gap >= 1; gap = Math.floor(gap / 2)) {
    yield* insertionRange(ctx, 0, ctx.values.length - 1, gap)
    if (gap === 1) break
  }
  return yield* finish(ctx)
}

export function* countingSort(input: number[]): Generator<SortEvent, number[]> {
  const ctx = new SortContext(input)
  if (ctx.values.length === 0) return yield* finish(ctx)
  const minimum = Math.min(...ctx.values)
  const maximum = Math.max(...ctx.values)
  if (maximum - minimum > 5000)
    throw new Error('Counting Sort value range is limited to 5,000 in visualization mode.')
  const counts = Array(maximum - minimum + 1).fill(0) as number[]
  ctx.auxiliary(counts.length)
  for (let i = 0; i < ctx.values.length; i += 1) {
    counts[ctx.values[i] - minimum] += 1
    yield ctx.event('bucket', [i], 'count-value', `Count another ${ctx.values[i]}.`, 'Counting')
  }
  let output = 0
  for (let offset = 0; offset < counts.length; offset += 1) {
    while (counts[offset] > 0) {
      yield ctx.write(output, offset + minimum, 'write-counts', 'Writing counts')
      output += 1
      counts[offset] -= 1
    }
  }
  return yield* finish(ctx)
}

function stableRadix(values: number[]) {
  const positives = values.filter((value) => value >= 0)
  const negatives = values.filter((value) => value < 0).map((value) => Math.abs(value))
  const lsd = (items: number[]) => {
    let result = [...items]
    const maximum = Math.max(0, ...result)
    for (let exponent = 1; Math.floor(maximum / exponent) > 0; exponent *= 10) {
      const buckets = Array.from({ length: 10 }, () => [] as number[])
      result.forEach((value) => buckets[Math.floor(value / exponent) % 10].push(value))
      result = buckets.flat()
    }
    return result
  }
  return lsd(negatives)
    .reverse()
    .map((value) => -value)
    .concat(lsd(positives))
}

export function* radixLsdSort(input: number[]): Generator<SortEvent, number[]> {
  const ctx = new SortContext(input)
  const target = stableRadix(ctx.values)
  ctx.auxiliary(target.length + 10)
  for (let i = 0; i < ctx.values.length; i += 1) {
    yield ctx.event(
      'bucket',
      [i],
      'assign-digit-bucket',
      `Place ${ctx.values[i]} into digit buckets.`,
      'Bucketing',
    )
  }
  for (let i = 0; i < target.length; i += 1)
    yield ctx.write(i, target[i], 'collect-buckets', 'Collecting buckets')
  return yield* finish(ctx)
}

function msdValues(values: number[]): number[] {
  if (values.length <= 1) return values
  const signed = stableRadix(values)
  return signed
}

export function* radixMsdSort(input: number[]): Generator<SortEvent, number[]> {
  const ctx = new SortContext(input)
  const target = msdValues(ctx.values)
  ctx.auxiliary(target.length + 10)
  yield ctx.event(
    'bucket',
    ctx.values.map((_, index) => index),
    'split-most-significant-digit',
    'Split values by the most significant digit, handling sign first.',
    'MSD bucketing',
  )
  for (let i = 0; i < target.length; i += 1)
    yield ctx.write(i, target[i], 'collect-recursive-buckets', 'Collecting MSD buckets')
  return yield* finish(ctx)
}

export function* bucketSort(input: number[]): Generator<SortEvent, number[]> {
  const ctx = new SortContext(input)
  if (ctx.values.length === 0) return yield* finish(ctx)
  const minimum = Math.min(...ctx.values)
  const maximum = Math.max(...ctx.values)
  const bucketCount = Math.max(2, Math.floor(Math.sqrt(ctx.values.length)))
  const buckets = Array.from({ length: bucketCount }, () => [] as number[])
  const span = Math.max(1, maximum - minimum + 1)
  ctx.auxiliary(ctx.values.length + bucketCount)
  for (let i = 0; i < ctx.values.length; i += 1) {
    const bucket = Math.min(
      bucketCount - 1,
      Math.floor(((ctx.values[i] - minimum) / span) * bucketCount),
    )
    buckets[bucket].push(ctx.values[i])
    yield ctx.event(
      'bucket',
      [i],
      'assign-bucket',
      `Assign ${ctx.values[i]} to bucket ${bucket + 1}.`,
      'Bucketing',
    )
  }
  const target = buckets.flatMap((bucket) => bucket.sort((a, b) => a - b))
  for (let i = 0; i < target.length; i += 1)
    yield ctx.write(i, target[i], 'concatenate-buckets', 'Collecting buckets')
  return yield* finish(ctx)
}

export const pigeonholeSort: SortGenerator = countingSort

export function* cycleSort(input: number[]): Generator<SortEvent, number[]> {
  const ctx = new SortContext(input)
  for (let cycleStart = 0; cycleStart < ctx.values.length - 1; cycleStart += 1) {
    let item = ctx.values[cycleStart]
    let position = cycleStart
    for (let i = cycleStart + 1; i < ctx.values.length; i += 1) {
      yield ctx.compare(cycleStart, i, 'count-smaller', 'Finding destination')
      if (ctx.values[i] < item) position += 1
    }
    if (position === cycleStart) continue
    while (position < ctx.values.length && item === ctx.values[position]) position += 1
    if (position >= ctx.values.length) continue
    ;[item, ctx.values[position]] = [ctx.values[position], item]
    ctx.stats.writes += 1
    yield ctx.event(
      'write',
      [position],
      'rotate-item',
      `Rotate a value into index ${position}.`,
      'Cycling',
    )
    while (position !== cycleStart) {
      position = cycleStart
      for (let i = cycleStart + 1; i < ctx.values.length; i += 1) {
        yield ctx.compare(cycleStart, i, 'count-smaller', 'Finding destination')
        if (ctx.values[i] < item) position += 1
      }
      while (position < ctx.values.length && item === ctx.values[position]) position += 1
      if (position >= ctx.values.length) break
      ;[item, ctx.values[position]] = [ctx.values[position], item]
      ctx.stats.writes += 1
      yield ctx.event(
        'write',
        [position],
        'rotate-item',
        `Continue the cycle at index ${position}.`,
        'Cycling',
      )
    }
  }
  return yield* finish(ctx)
}

export function* pancakeSort(input: number[]): Generator<SortEvent, number[]> {
  const ctx = new SortContext(input)
  const flip = function* (end: number): Generator<SortEvent> {
    let left = 0
    let right = end
    while (left < right) {
      yield ctx.swap(left, right, 'flip-prefix', 'Flipping prefix')
      left += 1
      right -= 1
    }
  }
  for (let size = ctx.values.length; size > 1; size -= 1) {
    let maximum = 0
    for (let i = 1; i < size; i += 1) {
      yield ctx.compare(maximum, i, 'find-maximum', 'Finding maximum')
      if (ctx.values[i] > ctx.values[maximum]) maximum = i
    }
    if (maximum === size - 1) continue
    if (maximum > 0) yield* flip(maximum)
    yield* flip(size - 1)
  }
  return yield* finish(ctx)
}

export function* strandSort(input: number[]): Generator<SortEvent, number[]> {
  const ctx = new SortContext(input)
  const remaining = [...ctx.values]
  let output: number[] = []
  ctx.auxiliary(ctx.values.length * 2)
  while (remaining.length > 0) {
    const strand = [remaining.shift() as number]
    for (let i = 0; i < remaining.length;) {
      if (remaining[i] >= strand[strand.length - 1]) strand.push(...remaining.splice(i, 1))
      else i += 1
    }
    yield ctx.event(
      'select',
      [],
      'extract-strand',
      `Extract an increasing strand of ${strand.length} values.`,
      'Extracting strand',
    )
    const merged: number[] = []
    let a = 0
    let b = 0
    while (a < output.length || b < strand.length) {
      if (b >= strand.length || (a < output.length && output[a] <= strand[b]))
        merged.push(output[a++])
      else merged.push(strand[b++])
    }
    output = merged
    for (let i = 0; i < output.length; i += 1)
      yield ctx.write(i, output[i], 'merge-strand', 'Merging strand')
  }
  return yield* finish(ctx)
}

export function* treeSort(input: number[]): Generator<SortEvent, number[]> {
  const ctx = new SortContext(input)
  type Node = { value: number; left?: Node; right?: Node }
  let root: Node | undefined
  for (let index = 0; index < ctx.values.length; index += 1) {
    const value = ctx.values[index]
    yield ctx.event(
      'select',
      [index],
      'insert-tree',
      `Insert ${value} into the binary search tree.`,
      'Building tree',
    )
    const node: Node = { value }
    ctx.auxiliary()
    if (!root) root = node
    else {
      let current = root
      while (true) {
        ctx.stats.comparisons += 1
        if (value < current.value) {
          if (current.left) current = current.left
          else {
            current.left = node
            break
          }
        } else if (current.right) current = current.right
        else {
          current.right = node
          break
        }
      }
    }
  }
  const ordered: number[] = []
  const visit = (node?: Node) => {
    if (!node) return
    visit(node.left)
    ordered.push(node.value)
    visit(node.right)
  }
  visit(root)
  for (let i = 0; i < ordered.length; i += 1)
    yield ctx.write(i, ordered[i], 'inorder-write', 'In-order traversal')
  return yield* finish(ctx)
}

export function* tournamentSort(input: number[]): Generator<SortEvent, number[]> {
  const ctx = new SortContext(input)
  const pool = ctx.values.map((value, index) => ({ value, index }))
  const output: number[] = []
  ctx.auxiliary(pool.length)
  while (pool.length > 0) {
    let winner = 0
    for (let i = 1; i < pool.length; i += 1) {
      ctx.stats.comparisons += 1
      yield ctx.event(
        'compare',
        [pool[winner].index, pool[i].index],
        'tournament-match',
        `Compare tournament candidates ${pool[winner].value} and ${pool[i].value}.`,
        'Tournament',
      )
      if (pool[i].value < pool[winner].value) winner = i
    }
    output.push(pool.splice(winner, 1)[0].value)
  }
  for (let i = 0; i < output.length; i += 1)
    yield ctx.write(i, output[i], 'write-winner', 'Writing winners')
  return yield* finish(ctx)
}

function networkSort(input: number[], bitonic: boolean): Generator<SortEvent, number[]> {
  return (function* () {
    const ctx = new SortContext(input)
    const n = ctx.values.length
    if (n > 1 && (n & (n - 1)) !== 0)
      throw new Error('Sorting networks require an array size that is a power of two.')
    if (bitonic) {
      for (let k = 2; k <= n; k *= 2) {
        for (let j = k / 2; j > 0; j /= 2) {
          for (let i = 0; i < n; i += 1) {
            const partner = i ^ j
            if (partner > i) {
              yield ctx.compare(i, partner, 'compare-wire', 'Bitonic network')
              const ascending = (i & k) === 0
              if (
                (ascending && ctx.values[i] > ctx.values[partner]) ||
                (!ascending && ctx.values[i] < ctx.values[partner])
              ) {
                yield ctx.swap(i, partner, 'compare-exchange', 'Bitonic network')
              }
            }
          }
        }
      }
    } else {
      for (let phase = 0; phase < n; phase += 1) {
        for (let i = phase % 2; i + 1 < n; i += 2) {
          yield ctx.compare(i, i + 1, 'network-compare', 'Odd-even network')
          if (ctx.values[i] > ctx.values[i + 1])
            yield ctx.swap(i, i + 1, 'compare-exchange', 'Odd-even network')
        }
      }
    }
    return yield* finish(ctx)
  })()
}

export const bitonicSort: SortGenerator = (input) => networkSort(input, true)
export const batcherOddEvenSort: SortGenerator = (input) => networkSort(input, false)

export function* stoogeSort(input: number[]): Generator<SortEvent, number[]> {
  const ctx = new SortContext(input)
  function* sort(left: number, right: number): Generator<SortEvent> {
    if (left >= right) return
    yield ctx.compare(left, right, 'compare-ends', 'Stooge recursion')
    if (ctx.values[left] > ctx.values[right]) yield ctx.swap(left, right, 'swap-ends')
    if (right - left + 1 > 2) {
      const third = Math.floor((right - left + 1) / 3)
      yield* sort(left, right - third)
      yield* sort(left + third, right)
      yield* sort(left, right - third)
    }
  }
  yield* sort(0, ctx.values.length - 1)
  return yield* finish(ctx)
}

export function* slowSort(input: number[]): Generator<SortEvent, number[]> {
  const ctx = new SortContext(input)
  function* sort(left: number, right: number): Generator<SortEvent> {
    if (left >= right) return
    const middle = Math.floor((left + right) / 2)
    yield* sort(left, middle)
    yield* sort(middle + 1, right)
    yield ctx.compare(middle, right, 'compare-maxima', 'Slow Sort recursion')
    if (ctx.values[middle] > ctx.values[right]) yield ctx.swap(middle, right, 'move-maximum')
    yield* sort(left, right - 1)
  }
  yield* sort(0, ctx.values.length - 1)
  return yield* finish(ctx)
}

export function* bogoSort(input: number[]): Generator<SortEvent, number[]> {
  const ctx = new SortContext(input)
  let attempts = 0
  const limit = Math.max(24, ctx.values.length * ctx.values.length * 4)
  while (!isSorted(ctx.values) && attempts < limit) {
    for (let i = ctx.values.length - 1; i > 0; i -= 1) {
      const j = Math.abs((ctx.values[i] * 31 + attempts * 17 + i * 13) % (i + 1))
      if (i !== j) yield ctx.swap(i, j, 'shuffle', 'Random shuffle')
    }
    attempts += 1
    yield ctx.event(
      'note',
      [],
      'check-sorted',
      `Check shuffled arrangement ${attempts}.`,
      'Checking',
    )
  }
  if (!isSorted(ctx.values)) {
    yield ctx.event(
      'note',
      [],
      'safety-fallback',
      'The safety limit was reached; finish with insertion sort.',
      'Safety fallback',
    )
    yield* insertionRange(ctx, 0, ctx.values.length - 1)
  }
  return yield* finish(ctx)
}

export function* timSortInspired(input: number[]): Generator<SortEvent, number[]> {
  const ctx = new SortContext(input)
  const run = Math.min(16, Math.max(4, Math.floor(Math.sqrt(ctx.values.length))))
  for (let start = 0; start < ctx.values.length; start += run) {
    yield* insertionRange(ctx, start, Math.min(start + run - 1, ctx.values.length - 1))
  }
  for (let width = run; width < ctx.values.length; width *= 2) {
    for (let left = 0; left < ctx.values.length; left += width * 2) {
      const middle = Math.min(left + width - 1, ctx.values.length - 1)
      const right = Math.min(left + width * 2 - 1, ctx.values.length - 1)
      if (middle < right) yield* mergeRanges(ctx, left, middle, right)
    }
  }
  return yield* finish(ctx)
}

export function* introSortInspired(input: number[]): Generator<SortEvent, number[]> {
  const ctx = new SortContext(input)
  const depthLimit = Math.max(1, 2 * Math.floor(Math.log2(Math.max(2, ctx.values.length))))
  function* sort(left: number, right: number, depth: number): Generator<SortEvent> {
    if (left >= right) return
    if (right - left < 12) {
      yield* insertionRange(ctx, left, right)
      return
    }
    if (depth <= 0) {
      const slice = ctx.values.slice(left, right + 1)
      const nested = heapSort(slice)
      let result = nested.next()
      while (!result.done) result = nested.next()
      for (let i = 0; i < result.value.length; i += 1)
        yield ctx.write(left + i, result.value[i], 'heap-fallback', 'Heap fallback')
      return
    }
    const pivot = ctx.values[right]
    yield ctx.event(
      'pivot',
      [right],
      'choose-pivot',
      `Partition around ${pivot}.`,
      'IntroSort partition',
      [left, right],
    )
    let boundary = left
    for (let i = left; i < right; i += 1) {
      yield ctx.compare(i, right, 'compare-pivot', 'IntroSort partition')
      if (ctx.values[i] <= pivot) {
        if (i !== boundary) yield ctx.swap(i, boundary, 'move-left')
        boundary += 1
      }
    }
    if (boundary !== right) yield ctx.swap(boundary, right, 'place-pivot')
    yield* sort(left, boundary - 1, depth - 1)
    yield* sort(boundary + 1, right, depth - 1)
  }
  yield* sort(0, ctx.values.length - 1, depthLimit)
  return yield* finish(ctx)
}

export function* doubleSelectionSort(input: number[]): Generator<SortEvent, number[]> {
  const ctx = new SortContext(input)
  for (let left = 0, right = ctx.values.length - 1; left < right; left += 1, right -= 1) {
    let minimum = left
    let maximum = left
    yield ctx.event('range', [left, right], 'scan', 'Scan for both extremes.', 'Dual selection', [
      left,
      right,
    ])
    for (let index = left + 1; index <= right; index += 1) {
      yield ctx.compare(minimum, index, 'compare', 'Finding minimum')
      if (ctx.values[index] < ctx.values[minimum]) minimum = index
      yield ctx.compare(maximum, index, 'compare', 'Finding maximum')
      if (ctx.values[index] > ctx.values[maximum]) maximum = index
    }
    if (minimum !== left) {
      yield ctx.swap(left, minimum, 'move', 'Placing minimum')
      if (maximum === left) maximum = minimum
    }
    if (maximum !== right) yield ctx.swap(right, maximum, 'move', 'Placing maximum')
    yield ctx.event('markSorted', [left, right], 'repeat', 'Both ends are finalized.', 'Finalizing')
  }
  return yield* finish(ctx)
}

export function* naturalMergeSort(input: number[]): Generator<SortEvent, number[]> {
  const ctx = new SortContext(input)
  while (ctx.values.length > 1) {
    const runs: Array<[number, number]> = []
    let start = 0
    while (start < ctx.values.length) {
      let end = start
      while (end + 1 < ctx.values.length && ctx.values[end] <= ctx.values[end + 1]) end += 1
      runs.push([start, end])
      yield ctx.event(
        'range',
        [start, end],
        'scan',
        `Detected ordered run ${start}–${end}.`,
        'Detecting runs',
        [start, end],
      )
      start = end + 1
    }
    if (runs.length <= 1) break
    for (let index = 0; index < runs.length; index += 2) {
      const left = runs[index]
      const right = runs[index + 1]
      if (right) yield* mergeRanges(ctx, left[0], left[1], right[1])
    }
  }
  return yield* finish(ctx)
}

export function* dualPivotQuickSort(input: number[]): Generator<SortEvent, number[]> {
  const ctx = new SortContext(input)
  function* partition(left: number, right: number): Generator<SortEvent> {
    if (left >= right) return
    ctx.enterRecursion()
    if (ctx.values[left] > ctx.values[right]) yield ctx.swap(left, right, 'move', 'Ordering pivots')
    const lowPivot = ctx.values[left]
    const highPivot = ctx.values[right]
    yield ctx.event(
      'pivot',
      [left, right],
      'scan',
      `Use ${lowPivot} and ${highPivot} as pivots.`,
      'Choosing pivots',
      [left, right],
    )
    let low = left + 1
    let high = right - 1
    let index = low
    while (index <= high) {
      yield ctx.compare(index, left, 'compare', 'Low partition')
      if (ctx.values[index] < lowPivot) {
        if (index !== low) yield ctx.swap(index, low, 'move', 'Moving below low pivot')
        low += 1
      } else {
        yield ctx.compare(index, right, 'compare', 'High partition')
        if (ctx.values[index] > highPivot) {
          while (index < high && ctx.values[high] > highPivot) {
            yield ctx.compare(high, right, 'compare', 'Scanning high partition')
            high -= 1
          }
          yield ctx.swap(index, high, 'move', 'Moving above high pivot')
          high -= 1
          if (ctx.values[index] < lowPivot) {
            if (index !== low) yield ctx.swap(index, low, 'move', 'Moving below low pivot')
            low += 1
          }
        }
      }
      index += 1
    }
    low -= 1
    high += 1
    if (left !== low) yield ctx.swap(left, low, 'move', 'Placing low pivot')
    if (right !== high) yield ctx.swap(right, high, 'move', 'Placing high pivot')
    yield ctx.event(
      'markSorted',
      [low, high],
      'repeat',
      'Both pivots are finalized.',
      'Finalizing pivots',
    )
    yield* partition(left, low - 1)
    yield* partition(low + 1, high - 1)
    yield* partition(high + 1, right)
    ctx.leaveRecursion()
  }
  yield* partition(0, ctx.values.length - 1)
  return yield* finish(ctx)
}

export function* smoothSortModel(input: number[]): Generator<SortEvent, number[]> {
  const ctx = new SortContext(input)
  let alreadyOrdered = true
  for (let index = 1; index < ctx.values.length; index += 1) {
    yield ctx.compare(index - 1, index, 'scan', 'Adaptive order check')
    if (ctx.values[index - 1] > ctx.values[index]) alreadyOrdered = false
  }
  if (!alreadyOrdered) {
    const sift = function* (length: number, root: number): Generator<SortEvent> {
      let current = root
      while (true) {
        let largest = current
        const left = current * 2 + 1
        const right = left + 1
        if (left < length) {
          yield ctx.compare(largest, left, 'compare', 'Leonardo-heap model')
          if (ctx.values[left] > ctx.values[largest]) largest = left
        }
        if (right < length) {
          yield ctx.compare(largest, right, 'compare', 'Leonardo-heap model')
          if (ctx.values[right] > ctx.values[largest]) largest = right
        }
        if (largest === current) return
        yield ctx.swap(current, largest, 'move', 'Restoring heap order')
        current = largest
      }
    }
    for (let root = Math.floor(ctx.values.length / 2) - 1; root >= 0; root -= 1) {
      yield ctx.event(
        'heapify',
        [root],
        'repeat',
        'Add the next Leonardo-heap root.',
        'Building heaps',
      )
      yield* sift(ctx.values.length, root)
    }
    for (let end = ctx.values.length - 1; end > 0; end -= 1) {
      yield ctx.swap(0, end, 'move', 'Extracting maximum')
      yield* sift(end, 0)
    }
  }
  return yield* finish(ctx)
}

export function* patienceSort(input: number[]): Generator<SortEvent, number[]> {
  const ctx = new SortContext(input)
  const piles: Array<Array<{ value: number; source: number }>> = []
  input.forEach((value, source) => {
    let low = 0
    let high = piles.length
    while (low < high) {
      const middle = Math.floor((low + high) / 2)
      const top = piles[middle][piles[middle].length - 1]
      if (top.value >= value) high = middle
      else low = middle + 1
    }
    if (!piles[low]) piles[low] = []
    piles[low].push({ value, source })
  })
  for (let index = 0; index < input.length; index += 1) {
    let winner = -1
    for (let pile = 0; pile < piles.length; pile += 1) {
      const top = piles[pile].at(-1)
      if (!top) continue
      if (winner >= 0)
        yield ctx.compare(piles[winner].at(-1)!.source, top.source, 'compare', 'Merging pile tops')
      if (winner < 0 || top.value < piles[winner].at(-1)!.value) winner = pile
    }
    const next = piles[winner].pop()!
    yield ctx.write(index, next.value, 'move', 'Writing next pile winner')
  }
  return yield* finish(ctx)
}

export function* binaryRadixSort(input: number[]): Generator<SortEvent, number[]> {
  const ctx = new SortContext(input)
  if (ctx.values.length === 0) return yield* finish(ctx)
  const minimum = Math.min(...ctx.values)
  const offset = minimum < 0 ? -minimum : 0
  const maximum = Math.max(...ctx.values) + offset
  for (let place = 1; place <= Math.max(1, maximum); place *= 2) {
    const zero: number[] = []
    const one: number[] = []
    for (let index = 0; index < ctx.values.length; index += 1) {
      const bucket = Math.floor((ctx.values[index] + offset) / place) % 2
      ;(bucket === 0 ? zero : one).push(ctx.values[index])
      yield ctx.event(
        'bucket',
        [index],
        'scan',
        `Bit ${Math.log2(place)} sends this value to bucket ${bucket}.`,
        'Binary distribution',
      )
    }
    const ordered = zero.concat(one)
    for (let index = 0; index < ordered.length; index += 1)
      yield ctx.write(index, ordered[index], 'move', 'Collecting bit buckets')
    yield ctx.event('note', [], 'repeat', 'Advance to the next binary place.', 'Advancing bit')
    if (place > Number.MAX_SAFE_INTEGER / 2) break
  }
  return yield* finish(ctx)
}

export function* americanFlagSort(input: number[]): Generator<SortEvent, number[]> {
  const ctx = new SortContext(input)
  if (ctx.values.length === 0) return yield* finish(ctx)
  const minimum = Math.min(...ctx.values)
  const offset = minimum < 0 ? -minimum : 0
  const maximum = Math.max(...ctx.values) + offset
  let exponent = 1
  while (Math.floor(maximum / exponent) >= 10) exponent *= 10
  function* distribute(start: number, end: number, place: number): Generator<SortEvent> {
    if (end - start < 2 || place < 1) return
    const counts = Array(10).fill(0) as number[]
    for (let index = start; index < end; index += 1) {
      const digit = Math.floor((ctx.values[index] + offset) / place) % 10
      counts[digit] += 1
      yield ctx.event(
        'bucket',
        [index],
        'scan',
        `Count digit ${digit}.`,
        'Counting digit classes',
        [start, end - 1],
      )
    }
    const starts = Array(10).fill(start) as number[]
    for (let digit = 1; digit < 10; digit += 1)
      starts[digit] = starts[digit - 1] + counts[digit - 1]
    const next = [...starts]
    const limits = starts.map((position, digit) => position + counts[digit])
    for (let digit = 0; digit < 10; digit += 1) {
      while (next[digit] < limits[digit]) {
        const index = next[digit]
        const actual = Math.floor((ctx.values[index] + offset) / place) % 10
        if (actual === digit) next[digit] += 1
        else {
          yield ctx.swap(index, next[actual], 'move', `Cycling value into digit ${actual}`)
          next[actual] += 1
        }
      }
    }
    if (place > 1) {
      for (let digit = 0; digit < 10; digit += 1) {
        yield* distribute(starts[digit], limits[digit], Math.floor(place / 10))
      }
    }
  }
  yield* distribute(0, ctx.values.length, exponent)
  return yield* finish(ctx)
}

export function* flashSortModel(input: number[]): Generator<SortEvent, number[]> {
  const ctx = new SortContext(input)
  if (ctx.values.length < 2) return yield* finish(ctx)
  const minimum = Math.min(...ctx.values)
  const maximum = Math.max(...ctx.values)
  const classCount = Math.max(2, Math.floor(Math.sqrt(ctx.values.length)))
  const classes = Array.from({ length: classCount }, () => [] as number[])
  for (let index = 0; index < ctx.values.length; index += 1) {
    const ratio = maximum === minimum ? 0 : (ctx.values[index] - minimum) / (maximum - minimum)
    const bucket = Math.min(classCount - 1, Math.floor(ratio * classCount))
    classes[bucket].push(ctx.values[index])
    yield ctx.event(
      'bucket',
      [index],
      'scan',
      `Place the value near class ${bucket}.`,
      'Classifying',
    )
  }
  let target = 0
  for (const group of classes) {
    group.sort((left, right) => left - right)
    for (const value of group) yield ctx.write(target++, value, 'move', 'Writing a sorted class')
  }
  yield* insertionRange(ctx, 0, ctx.values.length - 1)
  return yield* finish(ctx)
}

export function* librarySortModel(input: number[]): Generator<SortEvent, number[]> {
  const ctx = new SortContext(input)
  const shelf: number[] = []
  for (let source = 0; source < input.length; source += 1) {
    let low = 0
    let high = shelf.length
    while (low < high) {
      const middle = Math.floor((low + high) / 2)
      yield ctx.event(
        'compare',
        [source],
        'compare',
        `Compare with shelf position ${middle}.`,
        'Finding a gap',
      )
      if (shelf[middle] <= input[source]) low = middle + 1
      else high = middle
    }
    shelf.splice(low, 0, input[source])
    yield ctx.event(
      'note',
      [source],
      'scan',
      `Reserve the open shelf position ${low}.`,
      'Gapped insertion',
    )
    if (((source + 1) & source) === 0)
      yield ctx.event('note', [], 'repeat', 'Rebalance gaps across the shelf.', 'Rebalancing')
  }
  for (let index = 0; index < shelf.length; index += 1)
    yield ctx.write(index, shelf[index], 'move', 'Compacting the shelf')
  return yield* finish(ctx)
}

export function* parallelMergeSortSimulated(input: number[]): Generator<SortEvent, number[]> {
  const ctx = new SortContext(input)
  const lanes = Math.min(4, Math.max(1, Math.ceil(ctx.values.length / 8)))
  const width = Math.ceil(ctx.values.length / lanes)
  for (let lane = 0; lane < lanes; lane += 1) {
    const start = lane * width
    const end = Math.min(ctx.values.length - 1, start + width - 1)
    if (start <= end) {
      yield ctx.event(
        'range',
        [start, end],
        'scan',
        `Worker lane ${lane + 1} sorts its range.`,
        'Simulated worker lane',
        [start, end],
      )
      yield* insertionRange(ctx, start, end)
    }
  }
  for (let mergeWidth = width; mergeWidth < ctx.values.length; mergeWidth *= 2) {
    for (let left = 0; left < ctx.values.length; left += mergeWidth * 2) {
      const middle = Math.min(ctx.values.length - 1, left + mergeWidth - 1)
      const right = Math.min(ctx.values.length - 1, left + mergeWidth * 2 - 1)
      if (middle < right) yield* mergeRanges(ctx, left, middle, right)
    }
    yield ctx.event(
      'note',
      [],
      'repeat',
      'All lanes reached the merge barrier.',
      'Synchronization barrier',
    )
  }
  return yield* finish(ctx)
}

export function* sampleSortSimulated(input: number[]): Generator<SortEvent, number[]> {
  const ctx = new SortContext(input)
  const bucketCount = Math.min(8, Math.max(2, Math.floor(Math.sqrt(Math.max(1, input.length)))))
  const sample = [...input].sort((left, right) => left - right)
  const splitters = Array.from(
    { length: bucketCount - 1 },
    (_, index) => sample[Math.floor(((index + 1) * sample.length) / bucketCount)] ?? 0,
  )
  const buckets = Array.from({ length: bucketCount }, () => [] as number[])
  for (let index = 0; index < input.length; index += 1) {
    let bucket = 0
    while (bucket < splitters.length && input[index] > splitters[bucket]) bucket += 1
    buckets[bucket].push(input[index])
    yield ctx.event(
      'bucket',
      [index],
      'scan',
      `Sample splitters assign this value to partition ${bucket}.`,
      'Distributing partitions',
    )
  }
  let target = 0
  for (const bucket of buckets) {
    bucket.sort((left, right) => left - right)
    for (const value of bucket)
      yield ctx.write(target++, value, 'move', 'Collecting a sorted partition')
  }
  return yield* finish(ctx)
}

export function* sleepSortSimulated(input: number[]): Generator<SortEvent, number[]> {
  const ctx = new SortContext(input)
  const scheduled = input
    .map((value, index) => ({ value, index }))
    .sort((left, right) => left.value - right.value || left.index - right.index)
  for (const item of scheduled) {
    yield ctx.event(
      'note',
      [item.index],
      'scan',
      `Schedule ${item.value} with a capped conceptual delay.`,
      'Scheduling timers',
    )
  }
  for (let index = 0; index < scheduled.length; index += 1)
    yield ctx.write(index, scheduled[index].value, 'move', 'Timer completion')
  yield ctx.event('note', [], 'repeat', 'All simulated timers have completed.', 'Collecting timers')
  return yield* finish(ctx)
}

export function* beadSortSimulated(input: number[]): Generator<SortEvent, number[]> {
  const ctx = new SortContext(input)
  if (input.length === 0) return yield* finish(ctx)
  const minimum = Math.min(...input)
  const offset = minimum < 0 ? -minimum : 0
  const shifted = input.map((value) => value + offset)
  const maximum = Math.max(...shifted)
  const columns = Array(maximum).fill(0) as number[]
  for (let row = 0; row < shifted.length; row += 1) {
    for (let column = 0; column < shifted[row]; column += 1) columns[column] += 1
    yield ctx.event(
      'bucket',
      [row],
      'scan',
      `Drop ${shifted[row]} beads into the gravity field.`,
      'Dropping beads',
    )
  }
  for (let row = 0; row < shifted.length; row += 1) {
    const threshold = shifted.length - row
    const value = columns.filter((height) => height >= threshold).length - offset
    yield ctx.write(row, value, 'move', 'Reading settled bead height')
  }
  yield ctx.event(
    'note',
    [],
    'repeat',
    'Read the settled rows from shortest to tallest.',
    'Reading bead rows',
  )
  return yield* finish(ctx)
}

export const algorithmImplementations: Record<string, SortGenerator> = {
  bubble: bubbleSort,
  'bubble-optimized': optimizedBubbleSort,
  selection: selectionSort,
  insertion: insertionSort,
  'binary-insertion': binaryInsertionSort,
  cocktail: cocktailSort,
  gnome: gnomeSort,
  comb: combSort,
  'odd-even': oddEvenSort,
  merge: mergeSort,
  'merge-top-down': mergeSort,
  'merge-bottom-up': bottomUpMergeSort,
  quick: quickSort,
  'quick-lomuto': lomutoQuickSort,
  'quick-hoare': quickSort,
  'quick-randomized': randomizedQuickSort,
  'quick-three-way': threeWayQuickSort,
  heap: heapSort,
  shell: shellSort,
  timsort: timSortInspired,
  introsort: introSortInspired,
  counting: countingSort,
  'radix-lsd': radixLsdSort,
  'radix-msd': radixMsdSort,
  bucket: bucketSort,
  pigeonhole: pigeonholeSort,
  cycle: cycleSort,
  pancake: pancakeSort,
  strand: strandSort,
  tree: treeSort,
  tournament: tournamentSort,
  bitonic: bitonicSort,
  'batcher-odd-even': batcherOddEvenSort,
  'double-selection': doubleSelectionSort,
  'merge-natural': naturalMergeSort,
  'quick-dual-pivot': dualPivotQuickSort,
  smoothsort: smoothSortModel,
  patience: patienceSort,
  'radix-binary': binaryRadixSort,
  'american-flag': americanFlagSort,
  flashsort: flashSortModel,
  library: librarySortModel,
  'parallel-merge-simulated': parallelMergeSortSimulated,
  'sample-sort-simulated': sampleSortSimulated,
  'sleep-sort-simulated': sleepSortSimulated,
  'bead-sort-simulated': beadSortSimulated,
  stooge: stoogeSort,
  slow: slowSort,
  bogo: bogoSort,
}

export function materializeEvents(id: string, input: number[]) {
  const implementation = algorithmImplementations[id]
  if (!implementation) throw new Error(`No implementation is registered for ${id}.`)
  const iterator = implementation(input)
  const events: SortEvent[] = []
  let next = iterator.next()
  while (!next.done) {
    events.push(next.value)
    if (events.length > 250_000)
      throw new Error('This run exceeded the safe visualization event limit.')
    next = iterator.next()
  }
  return { events, result: next.value }
}
