import type { AlgorithmMeta } from '../types'
import { tokenizeCode, type CodeLanguage, type CodeLine } from './algorithmCode'

export interface FullAlgorithmCode {
  algorithmId: string
  language: CodeLanguage
  fidelity: 'reference' | 'visualizer-model'
  note: string
  lines: CodeLine[]
}

const modelAlgorithms = new Set([
  'smoothsort',
  'flashsort',
  'library',
  'parallel-merge-simulated',
  'sample-sort-simulated',
  'sleep-sort-simulated',
  'bead-sort-simulated',
])

function functionName(id: string) {
  return id.replaceAll('-', '_')
}

function swapHelper() {
  return `function swap(a: number[], left: number, right: number): void {
  const value = a[left];
  a[left] = a[right];
  a[right] = value;
}`
}

function insertionHelper() {
  return `function insertionRange(a: number[], first: number, last: number): void {
  for (let i = first + 1; i <= last; i += 1) {
    const value = a[i];
    let position = i - 1;
    while (position >= first && a[position] > value) {
      a[position + 1] = a[position];
      position -= 1;
    }
    a[position + 1] = value;
  }
}`
}

function elementarySource(id: string, name: string) {
  if (id === 'bubble')
    return `${swapHelper()}

export function ${name}(a: number[]): void {
  for (let end = a.length - 1; end > 0; end -= 1) {
    for (let i = 0; i < end; i += 1) {
      if (a[i] > a[i + 1]) {
        swap(a, i, i + 1);
      }
    }
  }
}`

  if (id === 'selection')
    return `${swapHelper()}

export function ${name}(a: number[]): void {
  for (let first = 0; first < a.length - 1; first += 1) {
    let minimum = first;
    for (let i = first + 1; i < a.length; i += 1) {
      if (a[i] < a[minimum]) {
        minimum = i;
      }
    }
    if (minimum !== first) {
      swap(a, first, minimum);
    }
  }
}`

  if (id === 'insertion')
    return `${insertionHelper()}

export function ${name}(a: number[]): void {
  insertionRange(a, 0, a.length - 1);
}`

  if (id === 'binary-insertion')
    return `export function ${name}(a: number[]): void {
  for (let i = 1; i < a.length; i += 1) {
    const value = a[i];
    let low = 0;
    let high = i;
    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      if (value < a[middle]) {
        high = middle;
      } else {
        low = middle + 1;
      }
    }
    for (let position = i; position > low; position -= 1) {
      a[position] = a[position - 1];
    }
    a[low] = value;
  }
}`

  if (id === 'cocktail')
    return `${swapHelper()}

export function ${name}(a: number[]): void {
  let first = 0;
  let last = a.length - 1;
  let changed = true;
  while (changed && first < last) {
    changed = false;
    for (let i = first; i < last; i += 1) {
      if (a[i] > a[i + 1]) {
        swap(a, i, i + 1);
        changed = true;
      }
    }
    last -= 1;
    for (let i = last; i > first; i -= 1) {
      if (a[i - 1] > a[i]) {
        swap(a, i - 1, i);
        changed = true;
      }
    }
    first += 1;
  }
}`

  if (id === 'gnome')
    return `${swapHelper()}

export function ${name}(a: number[]): void {
  let i = 1;
  while (i < a.length) {
    if (i === 0 || a[i - 1] <= a[i]) {
      i += 1;
    } else {
      swap(a, i - 1, i);
      i -= 1;
    }
  }
}`

  if (id === 'comb')
    return `${swapHelper()}

export function ${name}(a: number[]): void {
  let gap = a.length;
  let changed = true;
  while (gap > 1 || changed) {
    gap = Math.max(1, Math.floor((gap * 10) / 13));
    changed = false;
    for (let i = 0; i < a.length - gap; i += 1) {
      if (a[i] > a[i + gap]) {
        swap(a, i, i + gap);
        changed = true;
      }
    }
  }
}`

  if (id === 'odd-even')
    return `${swapHelper()}

export function ${name}(a: number[]): void {
  let changed = true;
  while (changed) {
    changed = false;
    for (let phase = 1; phase >= 0; phase -= 1) {
      for (let i = phase; i < a.length - 1; i += 2) {
        if (a[i] > a[i + 1]) {
          swap(a, i, i + 1);
          changed = true;
        }
      }
    }
  }
}`

  if (id === 'double-selection')
    return `${swapHelper()}

export function ${name}(a: number[]): void {
  let first = 0;
  let last = a.length - 1;
  while (first < last) {
    let minimum = first;
    let maximum = first;
    for (let i = first + 1; i <= last; i += 1) {
      if (a[i] < a[minimum]) minimum = i;
      if (a[i] > a[maximum]) maximum = i;
    }
    swap(a, first, minimum);
    if (maximum === first) maximum = minimum;
    swap(a, last, maximum);
    first += 1;
    last -= 1;
  }
}`

  return undefined
}

function mergeSource(id: string, name: string) {
  const merge = `function mergeRuns(a: number[], buffer: number[], first: number, middle: number, last: number): void {
  let left = first;
  let right = middle;
  let out = first;
  while (left < middle && right < last) {
    if (a[left] <= a[right]) {
      buffer[out] = a[left];
      left += 1;
    } else {
      buffer[out] = a[right];
      right += 1;
    }
    out += 1;
  }
  while (left < middle) {
    buffer[out] = a[left];
    out += 1;
    left += 1;
  }
  while (right < last) {
    buffer[out] = a[right];
    out += 1;
    right += 1;
  }
  for (let i = first; i < last; i += 1) a[i] = buffer[i];
}`

  if (id === 'merge-bottom-up')
    return `${merge}

export function ${name}(a: number[]): void {
  const buffer = new Array<number>(a.length).fill(0);
  let width = 1;
  while (width < a.length) {
    for (let first = 0; first < a.length; first += width * 2) {
      const middle = Math.min(first + width, a.length);
      const last = Math.min(first + width * 2, a.length);
      if (middle < last) mergeRuns(a, buffer, first, middle, last);
    }
    width *= 2;
  }
}`

  if (id === 'merge-natural')
    return `${merge}

export function ${name}(a: number[]): void {
  const buffer = new Array<number>(a.length).fill(0);
  while (true) {
    let first = 0;
    let merges = 0;
    while (first < a.length) {
      let middle = first + 1;
      while (middle < a.length && a[middle - 1] <= a[middle]) middle += 1;
      if (middle === a.length) break;
      let last = middle + 1;
      while (last < a.length && a[last - 1] <= a[last]) last += 1;
      mergeRuns(a, buffer, first, middle, last);
      merges += 1;
      first = last;
    }
    if (merges === 0) return;
  }
}`

  if (id === 'timsort')
    return `${insertionHelper()}

${merge}

export function ${name}(a: number[]): void {
  const minimumRun = 32;
  const buffer = new Array<number>(a.length).fill(0);
  for (let first = 0; first < a.length; first += minimumRun) {
    insertionRange(a, first, Math.min(first + minimumRun - 1, a.length - 1));
  }
  let width = minimumRun;
  while (width < a.length) {
    for (let first = 0; first < a.length; first += width * 2) {
      const middle = Math.min(first + width, a.length);
      const last = Math.min(first + width * 2, a.length);
      if (middle < last) mergeRuns(a, buffer, first, middle, last);
    }
    width *= 2;
  }
}`

  if (id === 'parallel-merge-simulated')
    return `${merge}

function sortLane(a: number[], buffer: number[], first: number, last: number): void {
  if (last - first < 2) return;
  const middle = Math.floor((first + last) / 2);
  sortLane(a, buffer, first, middle);
  sortLane(a, buffer, middle, last);
  mergeRuns(a, buffer, first, middle, last);
}

export function ${name}(a: number[]): void {
  const buffer = new Array<number>(a.length).fill(0);
  const middle = Math.floor(a.length / 2);
  // The visualizer schedules these independent lanes in deterministic order.
  sortLane(a, buffer, 0, middle);
  sortLane(a, buffer, middle, a.length);
  mergeRuns(a, buffer, 0, middle, a.length);
}`

  return `${merge}

function mergeSortRange(a: number[], buffer: number[], first: number, last: number): void {
  if (last - first < 2) return;
  const middle = Math.floor((first + last) / 2);
  mergeSortRange(a, buffer, first, middle);
  mergeSortRange(a, buffer, middle, last);
  mergeRuns(a, buffer, first, middle, last);
}

export function ${name}(a: number[]): void {
  const buffer = new Array<number>(a.length).fill(0);
  mergeSortRange(a, buffer, 0, a.length);
}`
}

function quickSource(id: string, name: string) {
  if (id === 'quick-three-way')
    return `${swapHelper()}

function quick3(a: number[], first: number, last: number): void {
  if (first >= last) return;
  const pivot = a[Math.floor((first + last) / 2)];
  let lower = first;
  let scan = first;
  let upper = last;
  while (scan <= upper) {
    if (a[scan] < pivot) {
      swap(a, lower, scan);
      lower += 1;
      scan += 1;
    } else if (a[scan] > pivot) {
      swap(a, scan, upper);
      upper -= 1;
    } else {
      scan += 1;
    }
  }
  quick3(a, first, lower - 1);
  quick3(a, upper + 1, last);
}

export function ${name}(a: number[]): void {
  quick3(a, 0, a.length - 1);
}`

  if (id === 'quick-dual-pivot')
    return `${swapHelper()}

function dualPivot(a: number[], first: number, last: number): void {
  if (first >= last) return;
  if (a[first] > a[last]) swap(a, first, last);
  const lowPivot = a[first];
  const highPivot = a[last];
  let lower = first + 1;
  let scan = lower;
  let upper = last - 1;
  while (scan <= upper) {
    if (a[scan] < lowPivot) {
      swap(a, scan, lower);
      scan += 1;
      lower += 1;
    } else if (a[scan] > highPivot) {
      swap(a, scan, upper);
      upper -= 1;
    } else {
      scan += 1;
    }
  }
  lower -= 1;
  upper += 1;
  swap(a, first, lower);
  swap(a, last, upper);
  dualPivot(a, first, lower - 1);
  dualPivot(a, lower + 1, upper - 1);
  dualPivot(a, upper + 1, last);
}

export function ${name}(a: number[]): void {
  dualPivot(a, 0, a.length - 1);
}`

  if (id === 'introsort')
    return `${swapHelper()}

${insertionHelper()}

function siftDown(a: number[], first: number, count: number, root: number): void {
  while (root * 2 + 1 < count) {
    let child = root * 2 + 1;
    if (child + 1 < count && a[first + child] < a[first + child + 1]) child += 1;
    if (a[first + root] >= a[first + child]) return;
    swap(a, first + root, first + child);
    root = child;
  }
}

function heapRange(a: number[], first: number, last: number): void {
  const count = last - first + 1;
  for (let root = Math.floor(count / 2) - 1; root >= 0; root -= 1) siftDown(a, first, count, root);
  for (let end = count - 1; end > 0; end -= 1) {
    swap(a, first, first + end);
    siftDown(a, first, end, 0);
  }
}

function floorLog2(value: number): number {
  let result = 0;
  while (value > 1) {
    value = Math.floor(value / 2);
    result += 1;
  }
  return result;
}

function intro(a: number[], first: number, last: number, depth: number): void {
  while (last - first > 16) {
    if (depth === 0) {
      heapRange(a, first, last);
      return;
    }
    depth -= 1;
    const pivot = a[Math.floor((first + last) / 2)];
    let left = first;
    let right = last;
    while (left <= right) {
      while (a[left] < pivot) left += 1;
      while (a[right] > pivot) right -= 1;
      if (left <= right) {
        swap(a, left, right);
        left += 1;
        right -= 1;
      }
    }
    intro(a, left, last, depth);
    last = right;
  }
  insertionRange(a, first, last);
}

export function ${name}(a: number[]): void {
  if (a.length < 2) return;
  const depth = 2 * floorLog2(a.length);
  intro(a, 0, a.length - 1, depth);
}`

  return `${swapHelper()}

function quickRange(a: number[], first: number, last: number): void {
  let left = first;
  let right = last;
  const pivot = a[Math.floor((first + last) / 2)];
  while (left <= right) {
    while (a[left] < pivot) left += 1;
    while (a[right] > pivot) right -= 1;
    if (left <= right) {
      swap(a, left, right);
      left += 1;
      right -= 1;
    }
  }
  if (first < right) quickRange(a, first, right);
  if (left < last) quickRange(a, left, last);
}

export function ${name}(a: number[]): void {
  if (a.length > 1) quickRange(a, 0, a.length - 1);
}`
}

function heapShellSource(id: string, name: string) {
  if (id === 'shell')
    return `export function ${name}(a: number[]): void {
  let gap = Math.floor(a.length / 2);
  while (gap > 0) {
    for (let i = gap; i < a.length; i += 1) {
      const value = a[i];
      let position = i;
      while (position >= gap && a[position - gap] > value) {
        a[position] = a[position - gap];
        position -= gap;
      }
      a[position] = value;
    }
    gap = Math.floor(gap / 2);
  }
}`

  const smoothComment =
    id === 'smoothsort'
      ? '  // SortLab models Smoothsort with an adaptive heap whose ordered prefixes are skipped.\n'
      : ''
  return `${swapHelper()}

function siftDown(a: number[], size: number, root: number): void {
  while (root * 2 + 1 < size) {
    let child = root * 2 + 1;
    if (child + 1 < size && a[child] < a[child + 1]) child += 1;
    if (a[root] >= a[child]) return;
    swap(a, root, child);
    root = child;
  }
}

export function ${name}(a: number[]): void {
${smoothComment}  for (let root = Math.floor(a.length / 2) - 1; root >= 0; root -= 1) {
    siftDown(a, a.length, root);
  }
  for (let end = a.length - 1; end > 0; end -= 1) {
    swap(a, 0, end);
    siftDown(a, end, 0);
  }
}`
}

function distributionSource(id: string, name: string) {
  if (id === 'counting' || id === 'pigeonhole')
    return `export function ${name}(a: number[]): void {
  if (a.length === 0) return;
  let minimum = a[0];
  let maximum = a[0];
  for (let i = 1; i < a.length; i += 1) {
    minimum = Math.min(minimum, a[i]);
    maximum = Math.max(maximum, a[i]);
  }
  const counts = new Array<number>(maximum - minimum + 1).fill(0);
  for (let i = 0; i < a.length; i += 1) counts[a[i] - minimum] += 1;
  let out = 0;
  for (let offset = 0; offset < counts.length; offset += 1) {
    while (counts[offset] > 0) {
      a[out] = offset + minimum;
      out += 1;
      counts[offset] -= 1;
    }
  }
}`

  if (id === 'radix-lsd')
    return `export function ${name}(a: number[]): void {
  if (a.length < 2) return;
  let minimum = a[0];
  let maximum = a[0];
  for (let i = 1; i < a.length; i += 1) {
    minimum = Math.min(minimum, a[i]);
    maximum = Math.max(maximum, a[i]);
  }
  let offset = 0;
  if (minimum < 0) offset = -minimum;
  const output = new Array<number>(a.length).fill(0);
  let place = 1;
  while (Math.floor((maximum + offset) / place) > 0) {
    const counts = new Array<number>(10).fill(0);
    for (let i = 0; i < a.length; i += 1) counts[Math.floor((a[i] + offset) / place) % 10] += 1;
    for (let digit = 1; digit < 10; digit += 1) counts[digit] += counts[digit - 1];
    for (let i = a.length - 1; i >= 0; i -= 1) {
      const digit = Math.floor((a[i] + offset) / place) % 10;
      counts[digit] -= 1;
      output[counts[digit]] = a[i];
    }
    for (let i = 0; i < a.length; i += 1) a[i] = output[i];
    place *= 10;
  }
}`

  if (id === 'american-flag')
    return `${swapHelper()}

function flagRange(a: number[], first: number, last: number, place: number): void {
  if (last - first < 2 || place === 0) return;
  const counts = new Array<number>(10).fill(0);
  for (let i = first; i < last; i += 1) counts[Math.floor(a[i] / place) % 10] += 1;
  const starts = new Array<number>(10).fill(first);
  for (let digit = 1; digit < 10; digit += 1) starts[digit] = starts[digit - 1] + counts[digit - 1];
  const next = starts.slice();
  for (let digit = 0; digit < 10; digit += 1) {
    const end = starts[digit] + counts[digit];
    while (next[digit] < end) {
      const index = next[digit];
      const target = Math.floor(a[index] / place) % 10;
      if (target === digit) next[digit] += 1;
      else {
        swap(a, index, next[target]);
        next[target] += 1;
      }
    }
  }
  const nextPlace = Math.floor(place / 10);
  for (let digit = 0; digit < 10; digit += 1) {
    flagRange(a, starts[digit], starts[digit] + counts[digit], nextPlace);
  }
}

export function ${name}(a: number[]): void {
  if (a.length < 2) return;
  let minimum = a[0];
  let maximum = 0;
  for (let i = 0; i < a.length; i += 1) minimum = Math.min(minimum, a[i]);
  let offset = 0;
  if (minimum < 0) offset = -minimum;
  for (let i = 0; i < a.length; i += 1) {
    a[i] += offset;
    maximum = Math.max(maximum, a[i]);
  }
  let place = 1;
  while (Math.floor(maximum / place) >= 10) place *= 10;
  flagRange(a, 0, a.length, place);
  for (let i = 0; i < a.length; i += 1) a[i] -= offset;
}`

  if (id === 'radix-msd' || id === 'radix-binary') {
    const base = id === 'radix-binary' ? 2 : 10
    return `function distribute(a: number[], buffer: number[], first: number, last: number, place: number): void {
  if (last - first < 2 || place === 0) return;
  const counts = new Array<number>(${base}).fill(0);
  for (let i = first; i < last; i += 1) counts[Math.floor(a[i] / place) % ${base}] += 1;
  const starts = new Array<number>(${base}).fill(first);
  for (let digit = 1; digit < ${base}; digit += 1) starts[digit] = starts[digit - 1] + counts[digit - 1];
  const next = starts.slice();
  for (let i = first; i < last; i += 1) {
    const digit = Math.floor(a[i] / place) % ${base};
    buffer[next[digit]] = a[i];
    next[digit] += 1;
  }
  for (let i = first; i < last; i += 1) a[i] = buffer[i];
  for (let digit = 0; digit < ${base}; digit += 1) {
    distribute(a, buffer, starts[digit], starts[digit] + counts[digit], Math.floor(place / ${base}));
  }
}

export function ${name}(a: number[]): void {
  if (a.length < 2) return;
  let maximum = 0;
  for (let i = 0; i < a.length; i += 1) maximum = Math.max(maximum, a[i]);
  let place = 1;
  while (Math.floor(maximum / place) >= ${base}) place *= ${base};
  const buffer = new Array<number>(a.length).fill(0);
  distribute(a, buffer, 0, a.length, place);
}`
  }

  if (id === 'bucket' || id === 'sample-sort-simulated')
    return `${insertionHelper()}

export function ${name}(a: number[]): void {
  if (a.length < 2) return;
  let minimum = a[0];
  let maximum = a[0];
  for (let i = 1; i < a.length; i += 1) {
    minimum = Math.min(minimum, a[i]);
    maximum = Math.max(maximum, a[i]);
  }
  const bucketCount = Math.max(2, Math.floor(Math.sqrt(a.length)));
  const counts = new Array<number>(bucketCount).fill(0);
  const buckets = new Array<number>(a.length).fill(0);
  for (let i = 0; i < a.length; i += 1) {
    let bucket = 0;
    if (maximum !== minimum) bucket = Math.min(bucketCount - 1, Math.floor(((a[i] - minimum) * bucketCount) / (maximum - minimum + 1)));
    counts[bucket] += 1;
  }
  const starts = new Array<number>(bucketCount).fill(0);
  for (let i = 1; i < bucketCount; i += 1) starts[i] = starts[i - 1] + counts[i - 1];
  const next = starts.slice();
  for (let i = 0; i < a.length; i += 1) {
    let bucket = 0;
    if (maximum !== minimum) bucket = Math.min(bucketCount - 1, Math.floor(((a[i] - minimum) * bucketCount) / (maximum - minimum + 1)));
    buckets[next[bucket]] = a[i];
    next[bucket] += 1;
  }
  for (let i = 0; i < a.length; i += 1) a[i] = buckets[i];
  for (let bucket = 0; bucket < bucketCount; bucket += 1) {
    insertionRange(a, starts[bucket], starts[bucket] + counts[bucket] - 1);
  }
}`

  if (id === 'flashsort')
    return `${insertionHelper()}

export function ${name}(a: number[]): void {
  if (a.length < 2) return;
  let minimum = a[0];
  let maximum = a[0];
  for (let i = 1; i < a.length; i += 1) {
    minimum = Math.min(minimum, a[i]);
    maximum = Math.max(maximum, a[i]);
  }
  if (minimum === maximum) return;
  const classes = Math.max(2, Math.floor(a.length * 0.43));
  const counts = new Array<number>(classes).fill(0);
  for (let i = 0; i < a.length; i += 1) {
    const group = Math.min(classes - 1, Math.floor(((a[i] - minimum) * (classes - 1)) / (maximum - minimum)));
    counts[group] += 1;
  }
  for (let group = 1; group < classes; group += 1) counts[group] += counts[group - 1];
  const output = new Array<number>(a.length).fill(0);
  for (let i = a.length - 1; i >= 0; i -= 1) {
    const group = Math.min(classes - 1, Math.floor(((a[i] - minimum) * (classes - 1)) / (maximum - minimum)));
    counts[group] -= 1;
    output[counts[group]] = a[i];
  }
  for (let i = 0; i < a.length; i += 1) a[i] = output[i];
  insertionRange(a, 0, a.length - 1);
}`

  return undefined
}

function specialSource(id: string, name: string) {
  if (id === 'cycle')
    return `export function ${name}(a: number[]): void {
  for (let start = 0; start < a.length - 1; start += 1) {
    let item = a[start];
    let position = start;
    for (let i = start + 1; i < a.length; i += 1) if (a[i] < item) position += 1;
    if (position === start) continue;
    while (item === a[position]) position += 1;
    let displaced = a[position];
    a[position] = item;
    item = displaced;
    while (position !== start) {
      position = start;
      for (let i = start + 1; i < a.length; i += 1) if (a[i] < item) position += 1;
      while (item === a[position]) position += 1;
      displaced = a[position];
      a[position] = item;
      item = displaced;
    }
  }
}`

  if (id === 'pancake')
    return `${swapHelper()}

function flip(a: number[], last: number): void {
  for (let first = 0; first < last; first += 1) {
    swap(a, first, last);
    last -= 1;
  }
}

export function ${name}(a: number[]): void {
  for (let size = a.length; size > 1; size -= 1) {
    let maximum = 0;
    for (let i = 1; i < size; i += 1) if (a[i] > a[maximum]) maximum = i;
    if (maximum === size - 1) continue;
    if (maximum > 0) flip(a, maximum);
    flip(a, size - 1);
  }
}`

  if (id === 'strand')
    return `function mergeLists(left: number[], leftCount: number, right: number[], rightCount: number, output: number[]): number {
  let i = 0;
  let j = 0;
  let count = 0;
  while (i < leftCount || j < rightCount) {
    if (j >= rightCount || (i < leftCount && left[i] <= right[j])) {
      output[count] = left[i];
      i += 1;
    } else {
      output[count] = right[j];
      j += 1;
    }
    count += 1;
  }
  return count;
}

export function ${name}(a: number[]): void {
  const remaining = a.slice();
  let remainingCount = a.length;
  const sorted = new Array<number>(a.length).fill(0);
  let sortedCount = 0;
  while (remainingCount > 0) {
    const strand = new Array<number>(a.length).fill(0);
    let strandCount = 1;
    strand[0] = remaining[0];
    let kept = 0;
    for (let i = 1; i < remainingCount; i += 1) {
      if (remaining[i] >= strand[strandCount - 1]) {
        strand[strandCount] = remaining[i];
        strandCount += 1;
      } else {
        remaining[kept] = remaining[i];
        kept += 1;
      }
    }
    const merged = new Array<number>(a.length).fill(0);
    sortedCount = mergeLists(sorted, sortedCount, strand, strandCount, merged);
    for (let i = 0; i < sortedCount; i += 1) sorted[i] = merged[i];
    remainingCount = kept;
  }
  for (let i = 0; i < a.length; i += 1) a[i] = sorted[i];
}`

  if (id === 'tree')
    return `function insertTree(values: number[], left: number[], right: number[], used: number, value: number): number {
  let node = 0;
  while (true) {
    if (value < values[node]) {
      if (left[node] === -1) {
        left[node] = used;
        values[used] = value;
        return used + 1;
      }
      node = left[node];
    } else {
      if (right[node] === -1) {
        right[node] = used;
        values[used] = value;
        return used + 1;
      }
      node = right[node];
    }
  }
}

function writeTree(values: number[], left: number[], right: number[], node: number, output: number[], index: number[]): void {
  if (node === -1) return;
  writeTree(values, left, right, left[node], output, index);
  output[index[0]] = values[node];
  index[0] += 1;
  writeTree(values, left, right, right[node], output, index);
}

export function ${name}(a: number[]): void {
  if (a.length === 0) return;
  const values = new Array<number>(a.length).fill(0);
  const left = new Array<number>(a.length).fill(-1);
  const right = new Array<number>(a.length).fill(-1);
  values[0] = a[0];
  let used = 1;
  for (let i = 1; i < a.length; i += 1) used = insertTree(values, left, right, used, a[i]);
  const outputIndex = new Array<number>(1).fill(0);
  writeTree(values, left, right, 0, a, outputIndex);
}`

  if (id === 'patience')
    return `export function ${name}(a: number[]): void {
  const length = a.length;
  const pileItems = new Array<number>(length * length).fill(0);
  const pileSizes = new Array<number>(length).fill(0);
  const pileTops = new Array<number>(length).fill(0);
  let pileCount = 0;
  for (let source = 0; source < length; source += 1) {
    let low = 0;
    let high = pileCount;
    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      if (pileTops[middle] >= a[source]) {
        high = middle;
      } else {
        low = middle + 1;
      }
    }
    const pile = low;
    pileItems[pile * length + pileSizes[pile]] = a[source];
    pileSizes[pile] += 1;
    pileTops[pile] = a[source];
    if (pile === pileCount) pileCount += 1;
  }
  for (let out = 0; out < length; out += 1) {
    let winner = -1;
    for (let pile = 0; pile < pileCount; pile += 1) {
      if (pileSizes[pile] > 0 && (winner === -1 || pileTops[pile] < pileTops[winner])) winner = pile;
    }
    a[out] = pileTops[winner];
    pileSizes[winner] -= 1;
    if (pileSizes[winner] > 0) {
      pileTops[winner] = pileItems[winner * length + pileSizes[winner] - 1];
    }
  }
}`

  if (id === 'tournament')
    return `export function ${name}(a: number[]): void {
  const used = new Array<number>(a.length).fill(0);
  const output = new Array<number>(a.length).fill(0);
  for (let out = 0; out < a.length; out += 1) {
    let winner = -1;
    for (let i = 0; i < a.length; i += 1) {
      if (used[i] === 0 && (winner === -1 || a[i] < a[winner])) winner = i;
    }
    output[out] = a[winner];
    used[winner] = 1;
  }
  for (let i = 0; i < a.length; i += 1) a[i] = output[i];
}`

  if (id === 'batcher-odd-even')
    return `${swapHelper()}

export function ${name}(a: number[]): void {
  if (a.length > 1 && (a.length & (a.length - 1)) !== 0) {
    throw new Error("network size must be a power of two");
  }
  for (let phase = 0; phase < a.length; phase += 1) {
    for (let i = phase % 2; i < a.length - 1; i += 2) {
      if (a[i] > a[i + 1]) swap(a, i, i + 1);
    }
  }
}`

  if (id === 'bitonic')
    return `${swapHelper()}

export function ${name}(a: number[]): void {
  if (a.length > 1 && (a.length & (a.length - 1)) !== 0) {
    throw new Error("network size must be a power of two");
  }
  let size = 2;
  while (size <= a.length) {
    let stride = Math.floor(size / 2);
    while (stride > 0) {
      for (let i = 0; i < a.length; i += 1) {
        const partner = i ^ stride;
        if (partner <= i) continue;
        const ascending = (i & size) === 0;
        if ((a[i] > a[partner]) === ascending) swap(a, i, partner);
      }
      stride = Math.floor(stride / 2);
    }
    size *= 2;
  }
}`

  if (id === 'library')
    return `${elementarySource('insertion', functionName('insertion'))}

export function ${name}(a: number[]): void {
  const shelf = new Array<number>(a.length * 2 + 1).fill(0);
  const occupied = new Array<number>(shelf.length).fill(0);
  for (let source = 0; source < a.length; source += 1) {
    let rank = 0;
    for (let i = 0; i < source; i += 1) if (a[i] <= a[source]) rank += 1;
    const gap = Math.floor(((rank + 1) * shelf.length) / (source + 2));
    let slot = gap;
    while (slot < shelf.length && occupied[slot] === 1) slot += 1;
    while (slot > 0 && occupied[slot] === 1) slot -= 1;
    shelf[slot] = a[source];
    occupied[slot] = 1;
  }
  let out = 0;
  for (let i = 0; i < shelf.length; i += 1) {
    if (occupied[i] === 1) {
      a[out] = shelf[i];
      out += 1;
    }
  }
  ${functionName('insertion')}(a);
}`

  if (id === 'sleep-sort-simulated')
    return `${insertionHelper()}

export function ${name}(a: number[]): void {
  // A deterministic browser model of timers: wake order is value order.
  const wakeQueue = a.slice();
  insertionRange(wakeQueue, 0, wakeQueue.length - 1);
  for (let i = 0; i < a.length; i += 1) a[i] = wakeQueue[i];
}`

  if (id === 'bead-sort-simulated')
    return `export function ${name}(a: number[]): void {
  if (a.length === 0) return;
  let maximum = 0;
  for (let i = 0; i < a.length; i += 1) maximum = Math.max(maximum, a[i]);
  const columns = new Array<number>(maximum).fill(0);
  for (let row = 0; row < a.length; row += 1) {
    for (let column = 0; column < a[row]; column += 1) columns[column] += 1;
  }
  for (let row = 0; row < a.length; row += 1) {
    const threshold = a.length - row;
    let value = 0;
    for (let column = 0; column < columns.length; column += 1) if (columns[column] >= threshold) value += 1;
    a[row] = value;
  }
}`

  if (id === 'stooge')
    return `${swapHelper()}

function stoogeRange(a: number[], first: number, last: number): void {
  if (a[first] > a[last]) swap(a, first, last);
  if (last - first + 1 > 2) {
    const third = Math.floor((last - first + 1) / 3);
    stoogeRange(a, first, last - third);
    stoogeRange(a, first + third, last);
    stoogeRange(a, first, last - third);
  }
}

export function ${name}(a: number[]): void {
  if (a.length > 0) stoogeRange(a, 0, a.length - 1);
}`

  if (id === 'slow')
    return `${swapHelper()}

function slowRange(a: number[], first: number, last: number): void {
  if (first >= last) return;
  const middle = Math.floor((first + last) / 2);
  slowRange(a, first, middle);
  slowRange(a, middle + 1, last);
  if (a[middle] > a[last]) swap(a, middle, last);
  slowRange(a, first, last - 1);
}

export function ${name}(a: number[]): void {
  if (a.length > 0) slowRange(a, 0, a.length - 1);
}`

  if (id === 'bogo')
    return `${swapHelper()}

${insertionHelper()}

function isSorted(a: number[]): boolean {
  for (let i = 1; i < a.length; i += 1) if (a[i - 1] > a[i]) return false;
  return true;
}

export function ${name}(a: number[]): void {
  let attempts = 0;
  while (!isSorted(a) && attempts < 50000) {
    for (let i = a.length - 1; i > 0; i -= 1) {
      const partner = Math.floor(Math.random() * (i + 1));
      swap(a, i, partner);
    }
    attempts += 1;
  }
  // SortLab's browser guard guarantees termination after the shuffle limit.
  if (!isSorted(a)) insertionRange(a, 0, a.length - 1);
}`

  return undefined
}

function typeScriptSource(algorithm: Pick<AlgorithmMeta, 'id'>) {
  const name = functionName(algorithm.id)
  const source =
    elementarySource(algorithm.id, name) ??
    (['merge', 'merge-bottom-up', 'merge-natural', 'timsort', 'parallel-merge-simulated'].includes(
      algorithm.id,
    )
      ? mergeSource(algorithm.id, name)
      : undefined) ??
    (['quick', 'quick-three-way', 'quick-dual-pivot', 'introsort'].includes(algorithm.id)
      ? quickSource(algorithm.id, name)
      : undefined) ??
    (['heap', 'shell', 'smoothsort'].includes(algorithm.id)
      ? heapShellSource(algorithm.id, name)
      : undefined) ??
    distributionSource(algorithm.id, name) ??
    specialSource(algorithm.id, name)
  if (!source) throw new Error(`No full code registered for ${algorithm.id}`)
  return source
}

function toCpp(source: string) {
  return `#include <algorithm>\n#include <cmath>\n#include <cstddef>\n#include <cstdlib>\n#include <stdexcept>\n#include <vector>\n\n${source}`
    .replace(
      /(?:export )?function (\w+)\(([^)]*)\): (void|number|boolean) \{/g,
      (_match, name: string, rawParameters: string, rawReturn: string) => {
        const parameters = rawParameters
          .split(',')
          .map((parameter) => {
            const [rawName, rawType] = parameter.trim().split(/:\s*/)
            const type =
              rawType === 'number[]' ? 'std::vector<int>&' : rawType === 'boolean' ? 'bool' : 'int'
            return `${type} ${rawName}`
          })
          .join(', ')
        const returnType = rawReturn === 'void' ? 'void' : rawReturn === 'boolean' ? 'bool' : 'int'
        return `${returnType} ${name}(${parameters}) {`
      },
    )
    .replaceAll('const ', 'auto ')
    .replaceAll('let ', 'auto ')
    .replaceAll('!==', '!=')
    .replaceAll('===', '==')
    .replaceAll('.length', '.size()')
    .replace(/\b(\w+)\.size\(\)/g, 'static_cast<int>($1.size())')
    .replace(/new Array<number>\((.+)\)\.fill\((.+)\)/g, 'std::vector<int>($1, $2)')
    .replaceAll('.slice()', '')
    .replaceAll('Math.floor', 'static_cast<int>')
    .replaceAll('Math.min', 'std::min')
    .replaceAll('Math.max', 'std::max')
    .replaceAll('Math.sqrt', 'std::sqrt')
    .replaceAll('Math.log2', 'std::log2')
    .replaceAll('Math.random()', '(double) rand() / RAND_MAX')
    .replaceAll('throw new Error(', 'throw std::invalid_argument(')
}

function toJava(source: string) {
  return `import java.util.Arrays;\n\nfinal class SortReference {\n${source
    .replace(
      /(?:export )?function (\w+)\(([^)]*)\): (void|number|boolean) \{/g,
      (_match, name: string, rawParameters: string, rawReturn: string) => {
        const parameters = rawParameters
          .split(',')
          .map((parameter) => {
            const [rawName, rawType] = parameter.trim().split(/:\s*/)
            const type =
              rawType === 'number[]' ? 'int[]' : rawType === 'boolean' ? 'boolean' : 'int'
            return `${type} ${rawName}`
          })
          .join(', ')
        const returnType =
          rawReturn === 'void' ? 'void' : rawReturn === 'boolean' ? 'boolean' : 'int'
        return `static ${returnType} ${name}(${parameters}) {`
      },
    )
    .replaceAll('const ', 'final var ')
    .replaceAll('let ', 'var ')
    .replaceAll('!==', '!=')
    .replaceAll('===', '==')
    .replace(/new Array<number>\((.+)\)\.fill\((.+)\)/g, 'filledArray($1, $2)')
    .replaceAll('.slice()', '.clone()')
    .replaceAll('Math.floor(', '(int) Math.floor(')
    .replaceAll('Math.random()', 'Math.random()')
    .replaceAll('throw new Error(', 'throw new IllegalArgumentException(')
    .split('\n')
    .map((line) => `  ${line}`)
    .join(
      '\n',
    )}\n\n  private static int[] filledArray(int length, int value) {\n    int[] result = new int[length];\n    Arrays.fill(result, value);\n    return result;\n  }\n}`
}

function pythonExpression(value: string) {
  return value
    .replace(/new Array<number>\((.+)\)\.fill\((.+)\)/g, '[$2] * ($1)')
    .replaceAll('===', '==')
    .replaceAll('!==', '!=')
    .replaceAll('&&', ' and ')
    .replaceAll('||', ' or ')
    .replace(/!([a-zA-Z_(])/g, 'not $1')
    .replace(/([a-zA-Z_][a-zA-Z0-9_]*)\.length/g, 'len($1)')
    .replaceAll('Math.floor', 'math.floor')
    .replaceAll('Math.min', 'min')
    .replaceAll('Math.max', 'max')
    .replaceAll('Math.sqrt', 'math.sqrt')
    .replaceAll('Math.log2', 'math.log2')
    .replaceAll('Math.random()', 'random.random()')
    .replaceAll('.slice()', '.copy()')
    .replaceAll('true', 'True')
    .replaceAll('false', 'False')
}

function matchingParenthesis(line: string, start: number) {
  let depth = 0
  for (let index = start; index < line.length; index += 1) {
    if (line[index] === '(') depth += 1
    else if (line[index] === ')') {
      depth -= 1
      if (depth === 0) return index
    }
  }
  return -1
}

function expandInlineControl(line: string): string[] {
  const trimmed = line.trim()
  const prefix = line.slice(0, line.length - line.trimStart().length)
  const keyword = ['if', 'while', 'for'].find((candidate) => trimmed.startsWith(`${candidate} (`))
  if (!keyword || trimmed.endsWith('{')) return [line]
  const open = trimmed.indexOf('(')
  const close = matchingParenthesis(trimmed, open)
  if (close < 0) return [line]
  const header = trimmed.slice(0, close + 1)
  const remainder = trimmed
    .slice(close + 1)
    .trim()
    .replace(/;$/, '')
  if (!remainder) return [line]
  const elseIndex = remainder.indexOf('; else ')
  if (keyword === 'if' && elseIndex >= 0) {
    const truthy = remainder.slice(0, elseIndex + 1)
    const falsy = remainder.slice(elseIndex + 7)
    return [
      `${prefix}${header} {`,
      ...expandInlineControl(`${prefix}  ${truthy}`),
      `${prefix}} else {`,
      ...expandInlineControl(`${prefix}  ${falsy}`),
      `${prefix}}`,
    ]
  }
  return [`${prefix}${header} {`, ...expandInlineControl(`${prefix}  ${remainder};`), `${prefix}}`]
}

function toPython(source: string) {
  const output = ['import math', 'import random', '']
  let depth = 0
  const expanded = source.split('\n').flatMap(expandInlineControl)
  for (const original of expanded) {
    let line = original.trim()
    if (!line) {
      output.push('')
      continue
    }
    while (line.startsWith('}')) {
      depth = Math.max(0, depth - 1)
      line = line.slice(1).trim()
    }
    if (!line) continue
    if (line.startsWith('//')) {
      output.push(`${'    '.repeat(depth)}#${line.slice(2)}`)
      continue
    }
    const opens = line.endsWith('{')
    if (opens) line = line.slice(0, -1).trim()
    line = line.replace(/;$/, '')
    line = line.replace(/^export function |^function /, 'def ')
    line = line.replace(/\(([^)]*)\): (void|number|boolean)$/, (_match, parameters: string) => {
      const clean = parameters
        .split(',')
        .map((parameter) => parameter.trim().replace(/: (number\[\]|number|boolean)$/, ''))
        .join(', ')
      return `(${clean})`
    })
    if (line.startsWith('def ')) line += ':'
    else if (line.startsWith('if (') && line.endsWith(')')) line = `if ${line.slice(4, -1)}:`
    else if (line.startsWith('else if (') && line.endsWith(')')) line = `elif ${line.slice(9, -1)}:`
    else if (line === 'else') line = 'else:'
    else if (line.startsWith('while (') && line.endsWith(')')) line = `while ${line.slice(7, -1)}:`
    else {
      const ascending = line.match(/^for \(let (\w+) = (.+); \1 (<|<=) (.+); \1 \+= (.+)\)$/)
      const descending = line.match(/^for \(let (\w+) = (.+); \1 (>|>=) (.+); \1 -= (.+)\)$/)
      if (ascending) {
        const [, variable, start, operator, end, step] = ascending
        line = `for ${variable} in range(${start}, ${operator === '<=' ? `(${end}) + 1` : end}, ${step}):`
      } else if (descending) {
        const [, variable, start, operator, end, step] = descending
        line = `for ${variable} in range(${start}, ${operator === '>=' ? `(${end}) - 1` : end}, -(${step})):`
      }
    }
    line = line.replace(/^(const|let) /, '').replace(/: (number\[\]|number|boolean)(?=\s*=)/, '')
    line = line.replace(/\b(\w+)\+\+/g, '$1 += 1').replace(/\b(\w+)--/g, '$1 -= 1')
    line = line.replace(/throw new Error\((.+)\)/, 'raise ValueError($1)')
    line = pythonExpression(line)
    output.push(`${'    '.repeat(depth)}${line}`)
    if (opens) depth += 1
  }
  return output.join('\n')
}

function toPseudocode(source: string) {
  return toPython(source)
    .replace(/^import .*\n/gm, '')
    .replace(/^def /gm, 'PROCEDURE ')
    .replace(/:\s*$/gm, '')
    .replace(/^ {4}/gm, '  ')
    .replace(/\bTrue\b/g, 'TRUE')
    .replace(/\bFalse\b/g, 'FALSE')
    .trim()
}

function sourceForLanguage(source: string, language: CodeLanguage) {
  if (language === 'typescript') return source
  if (language === 'python') return toPython(source)
  if (language === 'java') return toJava(source)
  if (language === 'c_cpp') return toCpp(source)
  return toPseudocode(source)
}

export function getFullAlgorithmCode(
  algorithm: Pick<AlgorithmMeta, 'id' | 'name' | 'approximation'>,
  language: CodeLanguage,
): FullAlgorithmCode {
  const fidelity =
    modelAlgorithms.has(algorithm.id) || algorithm.approximation ? 'visualizer-model' : 'reference'
  const note =
    fidelity === 'reference'
      ? 'Complete reference implementation. Visualization hooks are intentionally omitted so the sorting logic is readable.'
      : 'Complete source for SortLab’s deterministic educational model; this is not presented as a production implementation of the named system.'
  const source = sourceForLanguage(typeScriptSource(algorithm), language)
  const lines = source.split('\n').map((text, index): CodeLine => ({
    id: `full-${index + 1}`,
    text,
    explanation: '',
    indent: 0,
    tokens: tokenizeCode(text),
  }))
  return { algorithmId: algorithm.id, language, fidelity, note, lines }
}
