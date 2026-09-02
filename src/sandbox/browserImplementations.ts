export interface SandboxSortRuntime {
  values: number[]
  compare(left: number, right: number): Promise<void>
  swap(left: number, right: number): Promise<void>
  write(index: number, value: number): Promise<void>
  pivot(index: number, value: number): Promise<void>
  range(start: number, end: number): Promise<void>
}

export { browserImplementationKind, hasBrowserImplementation } from './implementationRegistry'

type PivotStrategy =
  'first' | 'last' | 'middle' | 'random' | 'median-three' | 'median-five' | 'ninther' | 'sample'

function deterministicRandom(values: number[]) {
  let state = values.reduce(
    (seed, value, index) => (seed ^ ((value + 31) * (index + 17))) >>> 0,
    0x9e3779b9,
  )
  return () => {
    state += 0x6d2b79f5
    let next = state
    next = Math.imul(next ^ (next >>> 15), next | 1)
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61)
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296
  }
}

async function insertionRange(
  runtime: SandboxSortRuntime,
  start = 0,
  end = runtime.values.length - 1,
  gap = 1,
) {
  for (let index = start + gap; index <= end; index += 1) {
    const value = runtime.values[index]
    let current = index
    while (current - gap >= start) {
      await runtime.compare(current - gap, current)
      if (runtime.values[current - gap] <= value) break
      await runtime.write(current, runtime.values[current - gap])
      current -= gap
    }
    if (current !== index) await runtime.write(current, value)
  }
}

async function bubbleSort(runtime: SandboxSortRuntime, optimized: boolean) {
  for (let end = runtime.values.length - 1; end > 0; end -= 1) {
    let changed = false
    for (let index = 0; index < end; index += 1) {
      await runtime.compare(index, index + 1)
      if (runtime.values[index] > runtime.values[index + 1]) {
        await runtime.swap(index, index + 1)
        changed = true
      }
    }
    if (optimized && !changed) return
  }
}

async function cocktailSort(runtime: SandboxSortRuntime) {
  let start = 0
  let end = runtime.values.length - 1
  let changed = true
  while (changed && start < end) {
    changed = false
    for (let index = start; index < end; index += 1) {
      await runtime.compare(index, index + 1)
      if (runtime.values[index] > runtime.values[index + 1]) {
        await runtime.swap(index, index + 1)
        changed = true
      }
    }
    end -= 1
    if (!changed) break
    changed = false
    for (let index = end; index > start; index -= 1) {
      await runtime.compare(index - 1, index)
      if (runtime.values[index - 1] > runtime.values[index]) {
        await runtime.swap(index - 1, index)
        changed = true
      }
    }
    start += 1
  }
}

async function oddEvenSort(runtime: SandboxSortRuntime) {
  let sorted = false
  while (!sorted) {
    sorted = true
    for (const phase of [1, 0]) {
      for (let index = phase; index + 1 < runtime.values.length; index += 2) {
        await runtime.compare(index, index + 1)
        if (runtime.values[index] > runtime.values[index + 1]) {
          await runtime.swap(index, index + 1)
          sorted = false
        }
      }
    }
  }
}

async function combSort(runtime: SandboxSortRuntime) {
  let gap = runtime.values.length
  let changed = true
  while (gap > 1 || changed) {
    gap = Math.max(1, Math.floor(gap / 1.3))
    if (gap === 9 || gap === 10) gap = 11
    changed = false
    for (let index = 0; index + gap < runtime.values.length; index += 1) {
      await runtime.compare(index, index + gap)
      if (runtime.values[index] > runtime.values[index + gap]) {
        await runtime.swap(index, index + gap)
        changed = true
      }
    }
  }
}

async function gnomeSort(runtime: SandboxSortRuntime) {
  let index = 1
  while (index < runtime.values.length) {
    await runtime.compare(index - 1, index)
    if (runtime.values[index - 1] <= runtime.values[index]) index += 1
    else {
      await runtime.swap(index - 1, index)
      index = Math.max(1, index - 1)
    }
  }
}

async function exchangeSort(runtime: SandboxSortRuntime) {
  for (let left = 0; left < runtime.values.length - 1; left += 1) {
    for (let right = left + 1; right < runtime.values.length; right += 1) {
      await runtime.compare(left, right)
      if (runtime.values[left] > runtime.values[right]) await runtime.swap(left, right)
    }
  }
}

async function restartSort(runtime: SandboxSortRuntime) {
  let index = 0
  while (index + 1 < runtime.values.length) {
    await runtime.compare(index, index + 1)
    if (runtime.values[index] > runtime.values[index + 1]) {
      await runtime.swap(index, index + 1)
      index = 0
    } else index += 1
  }
}

async function randomExchange(runtime: SandboxSortRuntime, adjacent: boolean) {
  const random = deterministicRandom(runtime.values)
  let misses = 0
  const targetMisses = Math.max(8, runtime.values.length * runtime.values.length)
  while (misses < targetMisses) {
    const left = Math.floor(random() * Math.max(1, runtime.values.length - (adjacent ? 1 : 0)))
    const right = adjacent ? left + 1 : Math.floor(random() * runtime.values.length)
    if (left === right) continue
    await runtime.compare(left, right)
    if (
      (left < right && runtime.values[left] > runtime.values[right]) ||
      (left > right && runtime.values[left] < runtime.values[right])
    ) {
      await runtime.swap(left, right)
      misses = 0
    } else misses += 1
  }
  await insertionRange(runtime)
}

async function annealingSort(runtime: SandboxSortRuntime) {
  const random = deterministicRandom(runtime.values)
  for (
    let temperature = Math.max(2, runtime.values.length);
    temperature >= 1;
    temperature = Math.floor(temperature * 0.82)
  ) {
    for (let pass = 0; pass < runtime.values.length * 2; pass += 1) {
      const left = Math.floor(random() * runtime.values.length)
      const distance = Math.max(1, Math.floor(random() * temperature))
      const right = Math.min(runtime.values.length - 1, left + distance)
      if (left === right) continue
      await runtime.compare(left, right)
      if (runtime.values[left] > runtime.values[right]) await runtime.swap(left, right)
    }
  }
  await insertionRange(runtime)
}

async function selectionSort(runtime: SandboxSortRuntime) {
  for (let start = 0; start < runtime.values.length - 1; start += 1) {
    let minimum = start
    for (let index = start + 1; index < runtime.values.length; index += 1) {
      await runtime.compare(minimum, index)
      if (runtime.values[index] < runtime.values[minimum]) minimum = index
    }
    if (minimum !== start) await runtime.swap(start, minimum)
  }
}

async function doubleSelectionSort(runtime: SandboxSortRuntime) {
  let start = 0
  let end = runtime.values.length - 1
  while (start < end) {
    let minimum = start
    let maximum = start
    for (let index = start + 1; index <= end; index += 1) {
      await runtime.compare(minimum, index)
      if (runtime.values[index] < runtime.values[minimum]) minimum = index
      await runtime.compare(maximum, index)
      if (runtime.values[index] > runtime.values[maximum]) maximum = index
    }
    if (minimum !== start) {
      await runtime.swap(start, minimum)
      if (maximum === start) maximum = minimum
    }
    if (maximum !== end) await runtime.swap(end, maximum)
    start += 1
    end -= 1
  }
}

async function bingoSort(runtime: SandboxSortRuntime) {
  if (runtime.values.length < 2) return
  let next = Math.min(...runtime.values)
  let position = 0
  while (position < runtime.values.length) {
    let nextGreater = Number.POSITIVE_INFINITY
    for (let index = position; index < runtime.values.length; index += 1) {
      await runtime.compare(position, index)
      if (runtime.values[index] === next) {
        if (index !== position) await runtime.swap(index, position)
        position += 1
      } else if (runtime.values[index] > next && runtime.values[index] < nextGreater)
        nextGreater = runtime.values[index]
    }
    next = nextGreater
  }
}

async function binaryInsertionSort(runtime: SandboxSortRuntime) {
  for (let index = 1; index < runtime.values.length; index += 1) {
    const value = runtime.values[index]
    let low = 0
    let high = index
    while (low < high) {
      const middle = Math.floor((low + high) / 2)
      await runtime.compare(middle, index)
      if (runtime.values[middle] <= value) low = middle + 1
      else high = middle
    }
    for (let current = index; current > low; current -= 1)
      await runtime.write(current, runtime.values[current - 1])
    if (low !== index) await runtime.write(low, value)
  }
}

async function pairInsertionSort(runtime: SandboxSortRuntime) {
  for (let index = 1; index < runtime.values.length; index += 2) {
    const end = Math.min(runtime.values.length - 1, index + 1)
    if (end !== index) {
      await runtime.compare(index, end)
      if (runtime.values[index] > runtime.values[end]) await runtime.swap(index, end)
    }
    await insertionRange(runtime, 0, end)
  }
}

async function cycleSort(runtime: SandboxSortRuntime) {
  for (let start = 0; start < runtime.values.length - 1; start += 1) {
    let item = runtime.values[start]
    let position = start
    for (let index = start + 1; index < runtime.values.length; index += 1) {
      await runtime.compare(start, index)
      if (runtime.values[index] < item) position += 1
    }
    if (position === start) continue
    while (item === runtime.values[position]) position += 1
    let displaced = runtime.values[position]
    await runtime.write(position, item)
    item = displaced
    while (position !== start) {
      position = start
      for (let index = start + 1; index < runtime.values.length; index += 1) {
        await runtime.compare(start, index)
        if (runtime.values[index] < item) position += 1
      }
      while (item === runtime.values[position]) position += 1
      displaced = runtime.values[position]
      await runtime.write(position, item)
      item = displaced
    }
  }
}

async function pancakeSort(runtime: SandboxSortRuntime) {
  const flip = async (end: number) => {
    for (let left = 0, right = end; left < right; left += 1, right -= 1)
      await runtime.swap(left, right)
  }
  for (let size = runtime.values.length; size > 1; size -= 1) {
    let maximum = 0
    for (let index = 1; index < size; index += 1) {
      await runtime.compare(maximum, index)
      if (runtime.values[index] > runtime.values[maximum]) maximum = index
    }
    if (maximum === size - 1) continue
    if (maximum > 0) await flip(maximum)
    await flip(size - 1)
  }
}

async function rankSort(runtime: SandboxSortRuntime) {
  const input = [...runtime.values]
  const ranks = Array(input.length).fill(0) as number[]
  for (let left = 0; left < input.length; left += 1) {
    for (let right = left + 1; right < input.length; right += 1) {
      await runtime.compare(left, right)
      if (input[left] <= input[right]) ranks[right] += 1
      else ranks[left] += 1
    }
  }
  const output = Array(input.length) as number[]
  for (let index = 0; index < input.length; index += 1) {
    let position = ranks[index]
    while (output[position] !== undefined) position += 1
    output[position] = input[index]
  }
  for (let index = 0; index < output.length; index += 1) await runtime.write(index, output[index])
}

async function tagSort(runtime: SandboxSortRuntime) {
  const indices = runtime.values.map((_, index) => index)
  for (let index = 1; index < indices.length; index += 1) {
    const key = indices[index]
    let current = index - 1
    while (current >= 0) {
      await runtime.compare(indices[current], key)
      if (runtime.values[indices[current]] <= runtime.values[key]) break
      indices[current + 1] = indices[current]
      current -= 1
    }
    indices[current + 1] = key
  }
  const output = indices.map((index) => runtime.values[index])
  for (let index = 0; index < output.length; index += 1) await runtime.write(index, output[index])
}

async function patienceSort(runtime: SandboxSortRuntime) {
  const piles: number[][] = []
  for (let index = 0; index < runtime.values.length; index += 1) {
    let low = 0
    let high = piles.length
    while (low < high) {
      const middle = Math.floor((low + high) / 2)
      if (piles[middle][piles[middle].length - 1] >= runtime.values[index]) high = middle
      else low = middle + 1
    }
    if (!piles[low]) piles[low] = []
    piles[low].push(runtime.values[index])
    await runtime.range(index, low)
  }
  for (let target = 0; target < runtime.values.length; target += 1) {
    let pile = 0
    for (let index = 1; index < piles.length; index += 1) {
      if (
        piles[index].length &&
        (!piles[pile].length ||
          piles[index][piles[index].length - 1] < piles[pile][piles[pile].length - 1])
      )
        pile = index
    }
    await runtime.write(target, piles[pile].pop()!)
  }
}

async function librarySort(runtime: SandboxSortRuntime) {
  type Entry = { value: number; source: number }
  const shelf: Array<Entry | undefined> = Array(Math.max(3, runtime.values.length * 2 + 1))
  const entries: Entry[] = []
  const rebalance = () => {
    shelf.fill(undefined)
    for (let index = 0; index < entries.length; index += 1) {
      const position = Math.floor(((index + 1) * shelf.length) / (entries.length + 1))
      shelf[position] = entries[index]
    }
  }
  for (let source = 0; source < runtime.values.length; source += 1) {
    const entry = { value: runtime.values[source], source }
    let low = 0
    let high = entries.length
    while (low < high) {
      const middle = Math.floor((low + high) / 2)
      await runtime.compare(entries[middle].source, source)
      if (entries[middle].value <= entry.value) low = middle + 1
      else high = middle
    }
    entries.splice(low, 0, entry)
    rebalance()
    await runtime.range(0, source)
  }
  for (let index = 0; index < entries.length; index += 1)
    await runtime.write(index, entries[index].value)
}

async function strandSort(runtime: SandboxSortRuntime) {
  const remaining = [...runtime.values]
  let output: number[] = []
  while (remaining.length) {
    const strand = [remaining.shift()!]
    for (let index = 0; index < remaining.length;) {
      if (remaining[index] >= strand[strand.length - 1]) strand.push(...remaining.splice(index, 1))
      else index += 1
    }
    const merged: number[] = []
    let left = 0
    let right = 0
    while (left < output.length || right < strand.length) {
      if (right >= strand.length || (left < output.length && output[left] <= strand[right]))
        merged.push(output[left++])
      else merged.push(strand[right++])
    }
    output = merged
    await runtime.range(0, Math.max(0, output.length - 1))
  }
  for (let index = 0; index < output.length; index += 1) await runtime.write(index, output[index])
}

async function tournamentSort(runtime: SandboxSortRuntime) {
  const remaining = runtime.values.map((value, index) => ({ value, index }))
  for (let target = 0; target < runtime.values.length; target += 1) {
    let winner = 0
    for (let index = 1; index < remaining.length; index += 1) {
      await runtime.compare(remaining[winner].index, remaining[index].index)
      if (remaining[index].value < remaining[winner].value) winner = index
    }
    await runtime.write(target, remaining.splice(winner, 1)[0].value)
  }
}

function shellGaps(id: string, length: number) {
  const gaps: number[] = []
  if (id.includes('hibbard'))
    for (let value = 1; value < length; value = value * 2 + 1) gaps.unshift(value)
  else if (id.includes('knuth'))
    for (let value = 1; value < length; value = value * 3 + 1) gaps.unshift(value)
  else if (id.includes('pratt')) {
    const values = new Set<number>()
    for (let two = 1; two < length; two *= 2)
      for (let value = two; value < length; value *= 3) values.add(value)
    gaps.push(...[...values].sort((left, right) => right - left))
  } else if (id.includes('tokuda')) {
    for (let k = 1; ; k += 1) {
      const value = Math.ceil((9 * (9 / 4) ** (k - 1) - 4) / 5)
      if (value >= length) break
      gaps.unshift(value)
    }
  } else if (id.includes('sedgewick')) {
    for (let k = 0; ; k += 1) {
      const value =
        k % 2 === 0 ? 9 * 2 ** k - 9 * 2 ** (k / 2) + 1 : 8 * 2 ** k - 6 * 2 ** ((k + 1) / 2) + 1
      if (value >= length) break
      gaps.unshift(value)
    }
  } else if (id.includes('ciura')) {
    const ciura = id.includes('extended')
      ? [701, 301, 132, 57, 23, 10, 4, 1]
      : [701, 301, 132, 57, 23, 10, 4, 1]
    let current = ciura[0]
    if (id.includes('extended'))
      while ((current = Math.floor(current * 2.25)) < length) ciura.unshift(current)
    gaps.push(...ciura.filter((value) => value < length))
  } else for (let gap = Math.floor(length / 2); gap > 0; gap = Math.floor(gap / 2)) gaps.push(gap)
  if (!gaps.includes(1)) gaps.push(1)
  return [...new Set(gaps)].sort((left, right) => right - left)
}

async function shellSort(runtime: SandboxSortRuntime, id: string) {
  for (const gap of shellGaps(id, runtime.values.length))
    await insertionRange(runtime, 0, runtime.values.length - 1, gap)
}

async function heapSort(runtime: SandboxSortRuntime, arity = 2) {
  const sift = async (length: number, root: number) => {
    let current = root
    while (true) {
      let largest = current
      for (
        let child = current * arity + 1;
        child < Math.min(length, current * arity + arity + 1);
        child += 1
      ) {
        await runtime.compare(largest, child)
        if (runtime.values[child] > runtime.values[largest]) largest = child
      }
      if (largest === current) return
      await runtime.swap(current, largest)
      current = largest
    }
  }
  for (let index = Math.floor((runtime.values.length - 2) / arity); index >= 0; index -= 1)
    await sift(runtime.values.length, index)
  for (let end = runtime.values.length - 1; end > 0; end -= 1) {
    await runtime.swap(0, end)
    await sift(end, 0)
  }
}

async function heapSortRange(runtime: SandboxSortRuntime, first: number, last: number) {
  const count = last - first + 1
  const sift = async (length: number, root: number) => {
    let current = root
    while (current * 2 + 1 < length) {
      let child = current * 2 + 1
      if (child + 1 < length) {
        await runtime.compare(first + child, first + child + 1)
        if (runtime.values[first + child] < runtime.values[first + child + 1]) child += 1
      }
      await runtime.compare(first + current, first + child)
      if (runtime.values[first + current] >= runtime.values[first + child]) return
      await runtime.swap(first + current, first + child)
      current = child
    }
  }
  for (let root = Math.floor(count / 2) - 1; root >= 0; root -= 1) await sift(count, root)
  for (let end = count - 1; end > 0; end -= 1) {
    await runtime.swap(first, first + end)
    await sift(end, 0)
  }
}

async function introSort(runtime: SandboxSortRuntime) {
  const sort = async (first: number, last: number, depth: number): Promise<void> => {
    while (last - first > 24) {
      if (depth === 0) return heapSortRange(runtime, first, last)
      depth -= 1
      const pivotIndex = Math.floor((first + last) / 2)
      const pivot = runtime.values[pivotIndex]
      await runtime.pivot(pivotIndex, pivot)
      let left = first
      let right = last
      while (left <= right) {
        while (runtime.values[left] < pivot) {
          await runtime.compare(left, pivotIndex)
          left += 1
        }
        while (runtime.values[right] > pivot) {
          await runtime.compare(right, pivotIndex)
          right -= 1
        }
        if (left <= right) {
          if (left !== right) await runtime.swap(left, right)
          left += 1
          right -= 1
        }
      }
      await sort(left, last, depth)
      last = right
    }
    if (first < last) await insertionRange(runtime, first, last)
  }
  const depth = 2 * Math.floor(Math.log2(Math.max(2, runtime.values.length)))
  await sort(0, runtime.values.length - 1, depth)
}

async function treeSort(runtime: SandboxSortRuntime) {
  interface Node {
    value: number
    source: number
    left?: Node
    right?: Node
  }
  let root: Node | undefined
  for (let index = 0; index < runtime.values.length; index += 1) {
    const node: Node = { value: runtime.values[index], source: index }
    if (!root) root = node
    else {
      let current = root
      while (true) {
        await runtime.compare(current.source, index)
        if (node.value < current.value) {
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
  for (let index = 0; index < ordered.length; index += 1) await runtime.write(index, ordered[index])
}

interface OrderedTreeNode {
  value: number
  source: number
  height: number
  red: boolean
  left?: OrderedTreeNode
  right?: OrderedTreeNode
}

function orderedBefore(value: number, source: number, node: OrderedTreeNode) {
  return value < node.value || (value === node.value && source < node.source)
}

function orderedTreeOutput(node: OrderedTreeNode | undefined, output: number[]) {
  if (!node) return
  orderedTreeOutput(node.left, output)
  output.push(node.value)
  orderedTreeOutput(node.right, output)
}

function treeHeight(node?: OrderedTreeNode) {
  return node?.height ?? 0
}

function refreshHeight(node: OrderedTreeNode) {
  node.height = Math.max(treeHeight(node.left), treeHeight(node.right)) + 1
  return node
}

function rotateTreeLeft(root: OrderedTreeNode) {
  const next = root.right!
  root.right = next.left
  next.left = root
  refreshHeight(root)
  return refreshHeight(next)
}

function rotateTreeRight(root: OrderedTreeNode) {
  const next = root.left!
  root.left = next.right
  next.right = root
  refreshHeight(root)
  return refreshHeight(next)
}

async function avlTreeSort(runtime: SandboxSortRuntime) {
  const insert = async (
    root: OrderedTreeNode | undefined,
    value: number,
    source: number,
  ): Promise<OrderedTreeNode> => {
    if (!root) return { value, source, height: 1, red: false }
    await runtime.compare(source, root.source)
    if (orderedBefore(value, source, root)) root.left = await insert(root.left, value, source)
    else root.right = await insert(root.right, value, source)
    refreshHeight(root)
    const balance = treeHeight(root.left) - treeHeight(root.right)
    if (balance > 1) {
      if (!orderedBefore(value, source, root.left!)) root.left = rotateTreeLeft(root.left!)
      return rotateTreeRight(root)
    }
    if (balance < -1) {
      if (orderedBefore(value, source, root.right!)) root.right = rotateTreeRight(root.right!)
      return rotateTreeLeft(root)
    }
    return root
  }

  let root: OrderedTreeNode | undefined
  for (let source = 0; source < runtime.values.length; source += 1) {
    root = await insert(root, runtime.values[source], source)
  }
  const output: number[] = []
  orderedTreeOutput(root, output)
  for (let index = 0; index < output.length; index += 1) await runtime.write(index, output[index])
}

async function redBlackTreeSort(runtime: SandboxSortRuntime) {
  const isRed = (node?: OrderedTreeNode) => node?.red === true
  const rotateLeft = (root: OrderedTreeNode) => {
    const next = rotateTreeLeft(root)
    next.red = root.red
    root.red = true
    return next
  }
  const rotateRight = (root: OrderedTreeNode) => {
    const next = rotateTreeRight(root)
    next.red = root.red
    root.red = true
    return next
  }
  const flipColors = (root: OrderedTreeNode) => {
    root.red = !root.red
    if (root.left) root.left.red = !root.left.red
    if (root.right) root.right.red = !root.right.red
  }
  const insert = async (
    root: OrderedTreeNode | undefined,
    value: number,
    source: number,
  ): Promise<OrderedTreeNode> => {
    if (!root) return { value, source, height: 1, red: true }
    await runtime.compare(source, root.source)
    if (orderedBefore(value, source, root)) root.left = await insert(root.left, value, source)
    else root.right = await insert(root.right, value, source)
    if (isRed(root.right) && !isRed(root.left)) root = rotateLeft(root)
    if (isRed(root.left) && isRed(root.left?.left)) root = rotateRight(root)
    if (isRed(root.left) && isRed(root.right)) flipColors(root)
    return refreshHeight(root)
  }

  let root: OrderedTreeNode | undefined
  for (let source = 0; source < runtime.values.length; source += 1) {
    root = await insert(root, runtime.values[source], source)
    root.red = false
  }
  const output: number[] = []
  orderedTreeOutput(root, output)
  for (let index = 0; index < output.length; index += 1) await runtime.write(index, output[index])
}

async function splayTreeSort(runtime: SandboxSortRuntime) {
  const splay = async (
    root: OrderedTreeNode | undefined,
    value: number,
    source: number,
  ): Promise<OrderedTreeNode | undefined> => {
    if (!root) return root
    await runtime.compare(source, root.source)
    if (orderedBefore(value, source, root)) {
      if (!root.left) return root
      if (orderedBefore(value, source, root.left)) {
        root.left.left = await splay(root.left.left, value, source)
        root = rotateTreeRight(root)
      } else {
        root.left.right = await splay(root.left.right, value, source)
        if (root.left.right) root.left = rotateTreeLeft(root.left)
      }
      return root.left ? rotateTreeRight(root) : root
    }
    if (value === root.value && source === root.source) return root
    if (!root.right) return root
    if (orderedBefore(value, source, root.right)) {
      root.right.left = await splay(root.right.left, value, source)
      if (root.right.left) root.right = rotateTreeRight(root.right)
    } else {
      root.right.right = await splay(root.right.right, value, source)
      root = rotateTreeLeft(root)
    }
    return root.right ? rotateTreeLeft(root) : root
  }

  let root: OrderedTreeNode | undefined
  for (let source = 0; source < runtime.values.length; source += 1) {
    if (!root) root = { value: runtime.values[source], source, height: 1, red: false }
    else {
      root = await splay(root, runtime.values[source], source)
      const node: OrderedTreeNode = {
        value: runtime.values[source],
        source,
        height: 1,
        red: false,
      }
      if (orderedBefore(node.value, node.source, root!)) {
        node.left = root!.left
        node.right = root
        root!.left = undefined
      } else {
        node.right = root!.right
        node.left = root
        root!.right = undefined
      }
      root = refreshHeight(node)
    }
  }
  const output: number[] = []
  orderedTreeOutput(root, output)
  for (let index = 0; index < output.length; index += 1) await runtime.write(index, output[index])
}

async function cartesianTreeSort(runtime: SandboxSortRuntime) {
  interface Node {
    value: number
    source: number
    left?: Node
    right?: Node
  }
  const stack: Node[] = []
  for (let source = 0; source < runtime.values.length; source += 1) {
    const node: Node = { value: runtime.values[source], source }
    let last: Node | undefined
    while (stack.length && stack[stack.length - 1].value > node.value) last = stack.pop()
    node.left = last
    if (stack.length) stack[stack.length - 1].right = node
    stack.push(node)
    await runtime.range(0, source)
  }
  const root = stack[0]
  const queue = root ? [root] : []
  const output: number[] = []
  while (queue.length) {
    let minimum = 0
    for (let index = 1; index < queue.length; index += 1)
      if (queue[index].value < queue[minimum].value) minimum = index
    const node = queue.splice(minimum, 1)[0]
    output.push(node.value)
    if (node.left) queue.push(node.left)
    if (node.right) queue.push(node.right)
  }
  for (let index = 0; index < output.length; index += 1) await runtime.write(index, output[index])
}

function choosePivotIndex(
  values: number[],
  left: number,
  right: number,
  strategy: PivotStrategy,
  random: () => number,
) {
  if (strategy === 'first') return left
  if (strategy === 'last') return right
  if (strategy === 'random') return left + Math.floor(random() * (right - left + 1))
  const samples =
    strategy === 'median-five'
      ? 5
      : strategy === 'ninther'
        ? 9
        : strategy === 'sample'
          ? Math.min(11, right - left + 1)
          : 3
  if (strategy === 'middle') return Math.floor((left + right) / 2)
  const indices = Array.from(
    { length: samples },
    (_, index) => left + Math.floor((index * (right - left)) / Math.max(1, samples - 1)),
  )
  indices.sort((a, b) => values[a] - values[b])
  return indices[Math.floor(indices.length / 2)]
}

function quickPivotStrategy(id: string): PivotStrategy {
  if (id.includes('first-element')) return 'first'
  if (id.includes('last-element') || id.includes('lomuto')) return 'last'
  if (id.includes('random')) return 'random'
  if (id.includes('median-of-five')) return 'median-five'
  if (id.includes('ninther')) return 'ninther'
  if (id.includes('sample') || id.includes('approximate')) return 'sample'
  if (id.includes('median-of-three')) return 'median-three'
  return 'middle'
}

async function quickSort(runtime: SandboxSortRuntime, id: string) {
  const random = deterministicRandom(runtime.values)
  const stack: Array<[number, number]> = [[0, runtime.values.length - 1]]
  const useLomuto = id.includes('lomuto') || id.includes('last-element')
  const useThreeWay = id.includes('three-way')
  const useDual = id.includes('dual-pivot') || id === 'multi-pivot-quicksort'
  while (stack.length) {
    const [left, right] = stack.pop()!
    if (left >= right) continue
    if (id.includes('insertion-sort-fallback') && right - left < 24) {
      await insertionRange(runtime, left, right)
      continue
    }
    const pivotIndex = choosePivotIndex(runtime.values, left, right, quickPivotStrategy(id), random)
    await runtime.pivot(pivotIndex, runtime.values[pivotIndex])
    if (useDual && right - left > 1) {
      await runtime.compare(left, right)
      if (runtime.values[left] > runtime.values[right]) await runtime.swap(left, right)
      const lowPivot = runtime.values[left]
      const highPivot = runtime.values[right]
      let lower = left + 1
      let upper = right - 1
      let scan = lower
      while (scan <= upper) {
        await runtime.compare(scan, left)
        if (runtime.values[scan] < lowPivot) await runtime.swap(scan++, lower++)
        else {
          await runtime.compare(scan, right)
          if (runtime.values[scan] > highPivot) await runtime.swap(scan, upper--)
          else scan += 1
        }
      }
      await runtime.swap(left, --lower)
      await runtime.swap(right, ++upper)
      stack.push([left, lower - 1], [lower + 1, upper - 1], [upper + 1, right])
    } else if (useThreeWay) {
      const pivot = runtime.values[pivotIndex]
      let lower = left
      let scan = left
      let upper = right
      while (scan <= upper) {
        await runtime.compare(scan, pivotIndex)
        if (runtime.values[scan] < pivot) await runtime.swap(lower++, scan++)
        else if (runtime.values[scan] > pivot) await runtime.swap(scan, upper--)
        else scan += 1
      }
      stack.push([left, lower - 1], [upper + 1, right])
    } else if (useLomuto) {
      if (pivotIndex !== right) await runtime.swap(pivotIndex, right)
      const pivot = runtime.values[right]
      let boundary = left
      for (let scan = left; scan < right; scan += 1) {
        await runtime.compare(scan, right)
        if (runtime.values[scan] <= pivot) await runtime.swap(boundary++, scan)
      }
      await runtime.swap(boundary, right)
      stack.push([left, boundary - 1], [boundary + 1, right])
    } else {
      const pivot = runtime.values[pivotIndex]
      let low = left
      let high = right
      while (low <= high) {
        while (runtime.values[low] < pivot) {
          await runtime.compare(low, pivotIndex)
          low += 1
        }
        while (runtime.values[high] > pivot) {
          await runtime.compare(high, pivotIndex)
          high -= 1
        }
        if (low <= high) {
          if (low !== high) await runtime.swap(low, high)
          low += 1
          high -= 1
        }
      }
      stack.push([left, high], [low, right])
    }
  }
}

async function stableQuickSort(runtime: SandboxSortRuntime) {
  const sort = async (
    entries: Array<{ value: number; source: number }>,
  ): Promise<Array<{ value: number; source: number }>> => {
    if (entries.length < 2) return entries
    const pivot = entries[Math.floor(entries.length / 2)]
    const lower: typeof entries = []
    const equal: typeof entries = []
    const higher: typeof entries = []
    for (const entry of entries) {
      await runtime.compare(entry.source, pivot.source)
      if (entry.value < pivot.value) lower.push(entry)
      else if (entry.value > pivot.value) higher.push(entry)
      else equal.push(entry)
    }
    return [...(await sort(lower)), ...equal, ...(await sort(higher))]
  }
  const output = await sort(runtime.values.map((value, source) => ({ value, source })))
  for (let index = 0; index < output.length; index += 1)
    await runtime.write(index, output[index].value)
}

async function mergeRange(
  runtime: SandboxSortRuntime,
  left: number,
  middle: number,
  right: number,
) {
  const source = runtime.values.slice(left, right + 1)
  let first = 0
  let second = middle - left + 1
  let target = left
  while (first <= middle - left || second <= right - left) {
    if (first <= middle - left && second <= right - left)
      await runtime.compare(left + first, left + second)
    const value =
      second > right - left || (first <= middle - left && source[first] <= source[second])
        ? source[first++]
        : source[second++]
    if (runtime.values[target] !== value) await runtime.write(target, value)
    target += 1
  }
}

async function bottomUpMergeSort(runtime: SandboxSortRuntime) {
  for (let width = 1; width < runtime.values.length; width *= 2) {
    for (let left = 0; left < runtime.values.length; left += width * 2) {
      const middle = Math.min(left + width - 1, runtime.values.length - 1)
      const right = Math.min(left + width * 2 - 1, runtime.values.length - 1)
      if (middle < right) await mergeRange(runtime, left, middle, right)
    }
  }
}

async function topDownMergeSort(runtime: SandboxSortRuntime) {
  const sort = async (left: number, right: number): Promise<void> => {
    if (left >= right) return
    const middle = Math.floor((left + right) / 2)
    await sort(left, middle)
    await sort(middle + 1, right)
    await mergeRange(runtime, left, middle, right)
  }
  await sort(0, runtime.values.length - 1)
}

async function naturalMergeSort(runtime: SandboxSortRuntime) {
  while (true) {
    const runs: Array<[number, number]> = []
    let start = 0
    while (start < runtime.values.length) {
      let end = start
      while (end + 1 < runtime.values.length && runtime.values[end] <= runtime.values[end + 1]) {
        await runtime.compare(end, end + 1)
        end += 1
      }
      runs.push([start, end])
      start = end + 1
    }
    if (runs.length <= 1) return
    for (let index = 0; index + 1 < runs.length; index += 2)
      await mergeRange(runtime, runs[index][0], runs[index][1], runs[index + 1][1])
  }
}

async function kWayMergeSort(runtime: SandboxSortRuntime, ways: number) {
  const sort = async (left: number, right: number): Promise<void> => {
    if (left >= right) return
    const width = Math.ceil((right - left + 1) / ways)
    const ranges: Array<[number, number]> = []
    for (let start = left; start <= right; start += width) {
      const end = Math.min(right, start + width - 1)
      ranges.push([start, end])
      await sort(start, end)
    }
    while (ranges.length > 1) {
      const first = ranges.shift()!
      const second = ranges.shift()!
      await mergeRange(runtime, first[0], first[1], second[1])
      ranges.unshift([first[0], second[1]])
    }
  }
  await sort(0, runtime.values.length - 1)
}

async function inPlaceMergeSort(runtime: SandboxSortRuntime) {
  const sort = async (left: number, right: number): Promise<void> => {
    if (left >= right) return
    let middle = Math.floor((left + right) / 2)
    await sort(left, middle)
    await sort(middle + 1, right)
    let first = left
    let second = middle + 1
    while (first <= middle && second <= right) {
      await runtime.compare(first, second)
      if (runtime.values[first] <= runtime.values[second]) first += 1
      else {
        const value = runtime.values[second]
        for (let index = second; index > first; index -= 1)
          await runtime.write(index, runtime.values[index - 1])
        await runtime.write(first, value)
        first += 1
        middle += 1
        second += 1
      }
    }
  }
  await sort(0, runtime.values.length - 1)
}

async function rotationMergeSort(runtime: SandboxSortRuntime) {
  const sort = async (left: number, right: number): Promise<void> => {
    if (left >= right) return
    let middle = Math.floor((left + right) / 2)
    await sort(left, middle)
    await sort(middle + 1, right)
    let first = left
    let second = middle + 1
    while (first < second && second <= right) {
      await runtime.compare(first, second)
      if (runtime.values[first] <= runtime.values[second]) {
        first += 1
        continue
      }
      // Rotate the first value of the right run into the left run using only
      // adjacent exchanges. This keeps the merge stable and in-place.
      for (let index = second; index > first; index -= 1) {
        await runtime.swap(index - 1, index)
      }
      first += 1
      middle += 1
      second += 1
    }
  }
  await sort(0, runtime.values.length - 1)
}

function minimumRunLength(length: number) {
  let remainder = 0
  while (length >= 64) {
    remainder |= length & 1
    length >>= 1
  }
  return length + remainder
}

async function timSort(runtime: SandboxSortRuntime) {
  const length = runtime.values.length
  if (length < 2) return
  const minimumRun = minimumRunLength(length)
  const runs: Array<{ start: number; length: number }> = []

  const mergeAt = async (index: number) => {
    const left = runs[index]
    const right = runs[index + 1]
    await mergeRange(
      runtime,
      left.start,
      left.start + left.length - 1,
      right.start + right.length - 1,
    )
    runs.splice(index, 2, { start: left.start, length: left.length + right.length })
  }

  const collapse = async () => {
    while (runs.length > 1) {
      const count = runs.length
      const x = count > 2 ? runs[count - 3].length : Number.POSITIVE_INFINITY
      const y = runs[count - 2].length
      const z = runs[count - 1].length
      if (x > y + z && y > z) return
      await mergeAt(count > 2 && x < z ? count - 3 : count - 2)
    }
  }

  let start = 0
  while (start < length) {
    let end = Math.min(start + 1, length)
    if (end < length) {
      const descending = runtime.values[end] < runtime.values[start]
      while (
        end + 1 < length &&
        (descending
          ? runtime.values[end + 1] < runtime.values[end]
          : runtime.values[end + 1] >= runtime.values[end])
      ) {
        await runtime.compare(end, end + 1)
        end += 1
      }
      if (descending) {
        for (let left = start, right = end; left < right; left += 1, right -= 1) {
          await runtime.swap(left, right)
        }
      }
    }
    const targetEnd = Math.min(length - 1, Math.max(end, start + minimumRun - 1))
    await insertionRange(runtime, start, targetEnd)
    runs.push({ start, length: targetEnd - start + 1 })
    await collapse()
    start = targetEnd + 1
  }
  while (runs.length > 1) await mergeAt(runs.length - 2)
}

async function countingSort(runtime: SandboxSortRuntime, stable: boolean) {
  if (!runtime.values.length) return
  const input = [...runtime.values]
  const minimum = Math.min(...input)
  const maximum = Math.max(...input)
  const counts = new Uint32Array(maximum - minimum + 1)
  for (const value of input) counts[value - minimum] += 1
  if (stable) {
    for (let index = 1; index < counts.length; index += 1) counts[index] += counts[index - 1]
    const output = Array(input.length) as number[]
    for (let index = input.length - 1; index >= 0; index -= 1)
      output[--counts[input[index] - minimum]] = input[index]
    for (let index = 0; index < output.length; index += 1) await runtime.write(index, output[index])
  } else {
    let target = 0
    for (let offset = 0; offset < counts.length; offset += 1)
      for (let count = 0; count < counts[offset]; count += 1)
        await runtime.write(target++, offset + minimum)
  }
}

async function radixSort(runtime: SandboxSortRuntime, base: number) {
  if (!runtime.values.length) return
  const minimum = Math.min(...runtime.values)
  const offset = minimum < 0 ? -minimum : 0
  const working = runtime.values.map((value) => value + offset)
  const maximum = Math.max(...working)
  const output = Array(working.length) as number[]
  for (let exponent = 1; Math.floor(maximum / exponent) > 0; exponent *= base) {
    const counts = new Uint32Array(base)
    for (const value of working) counts[Math.floor(value / exponent) % base] += 1
    for (let index = 1; index < base; index += 1) counts[index] += counts[index - 1]
    for (let index = working.length - 1; index >= 0; index -= 1) {
      const digit = Math.floor(working[index] / exponent) % base
      output[--counts[digit]] = working[index]
    }
    for (let index = 0; index < working.length; index += 1) {
      working[index] = output[index]
      await runtime.write(index, output[index] - offset)
    }
  }
}

async function binaryRadixSort(runtime: SandboxSortRuntime) {
  const input = [...runtime.values]
  const minimum = Math.min(...input)
  const offset = minimum < 0 ? -minimum : 0
  const values = input.map((value) => value + offset)
  const maximum = Math.max(...values)
  const sort = async (items: number[], bit: number): Promise<number[]> => {
    if (items.length < 2 || bit < 0) return items
    const zero: number[] = []
    const one: number[] = []
    for (const value of items) (value & (1 << bit) ? one : zero).push(value)
    return [...(await sort(zero, bit - 1)), ...(await sort(one, bit - 1))]
  }
  const bit = maximum ? Math.floor(Math.log2(maximum)) : 0
  const output = await sort(values, bit)
  for (let index = 0; index < output.length; index += 1)
    await runtime.write(index, output[index] - offset)
}

async function msdRadixSort(runtime: SandboxSortRuntime, base = 10) {
  if (runtime.values.length < 2) return
  const minimum = Math.min(...runtime.values)
  const offset = minimum < 0 ? -minimum : 0
  const source = runtime.values.map((value) => value + offset)
  const maximum = Math.max(...source)
  let place = 1
  while (Math.floor(maximum / place) >= base) place *= base

  const sort = async (values: number[], currentPlace: number): Promise<number[]> => {
    if (values.length < 2 || currentPlace === 0) return values
    const buckets = Array.from({ length: base }, () => [] as number[])
    for (let index = 0; index < values.length; index += 1) {
      const digit = Math.floor(values[index] / currentPlace) % base
      buckets[digit].push(values[index])
      await runtime.range(index, digit)
    }
    const output: number[] = []
    for (const bucket of buckets)
      output.push(...(await sort(bucket, Math.floor(currentPlace / base))))
    return output
  }

  const output = await sort(source, place)
  for (let index = 0; index < output.length; index += 1) {
    await runtime.write(index, output[index] - offset)
  }
}

async function radixExchangeSort(runtime: SandboxSortRuntime) {
  if (runtime.values.length < 2) return
  const minimum = Math.min(...runtime.values)
  const offset = minimum < 0 ? -minimum : 0
  const maximum = Math.max(...runtime.values) + offset
  const highestBit = maximum === 0 ? 0 : Math.floor(Math.log2(maximum))

  const partition = async (left: number, right: number, bit: number): Promise<void> => {
    if (left >= right || bit < 0) return
    let first = left
    let last = right
    const mask = 2 ** bit
    while (first <= last) {
      while (first <= last && ((runtime.values[first] + offset) & mask) === 0) first += 1
      while (first <= last && ((runtime.values[last] + offset) & mask) !== 0) last -= 1
      if (first < last) await runtime.swap(first++, last--)
    }
    await partition(left, last, bit - 1)
    await partition(first, right, bit - 1)
  }

  await partition(0, runtime.values.length - 1, highestBit)
}

async function americanFlagSort(runtime: SandboxSortRuntime, base = 10) {
  if (runtime.values.length < 2) return
  const minimum = Math.min(...runtime.values)
  const offset = minimum < 0 ? -minimum : 0
  const maximum = Math.max(...runtime.values) + offset
  let place = 1
  while (Math.floor(maximum / place) >= base) place *= base

  const distribute = async (first: number, last: number, currentPlace: number): Promise<void> => {
    if (last - first < 2 || currentPlace === 0) return
    const counts = new Uint32Array(base)
    for (let index = first; index < last; index += 1) {
      counts[Math.floor((runtime.values[index] + offset) / currentPlace) % base] += 1
    }
    const starts = new Uint32Array(base)
    starts[0] = first
    for (let digit = 1; digit < base; digit += 1)
      starts[digit] = starts[digit - 1] + counts[digit - 1]
    const next = starts.slice()
    for (let digit = 0; digit < base; digit += 1) {
      const end = starts[digit] + counts[digit]
      while (next[digit] < end) {
        const index = next[digit]
        const targetDigit = Math.floor((runtime.values[index] + offset) / currentPlace) % base
        if (targetDigit === digit) next[digit] += 1
        else await runtime.swap(index, next[targetDigit]++)
      }
    }
    const nextPlace = Math.floor(currentPlace / base)
    for (let digit = 0; digit < base; digit += 1) {
      await distribute(starts[digit], starts[digit] + counts[digit], nextPlace)
    }
  }

  await distribute(0, runtime.values.length, place)
}

interface BinaryTrieNode {
  zero?: BinaryTrieNode
  one?: BinaryTrieNode
  count: number
}

async function trieSort(runtime: SandboxSortRuntime) {
  if (runtime.values.length < 2) return
  const minimum = Math.min(...runtime.values)
  const offset = minimum < 0 ? -minimum : 0
  const maximum = Math.max(...runtime.values) + offset
  const highestBit = maximum === 0 ? 0 : Math.floor(Math.log2(maximum))
  const root: BinaryTrieNode = { count: 0 }
  for (let index = 0; index < runtime.values.length; index += 1) {
    const value = runtime.values[index] + offset
    let node = root
    for (let bit = highestBit; bit >= 0; bit -= 1) {
      const branch = ((value >> bit) & 1) === 0 ? 'zero' : 'one'
      node[branch] ??= { count: 0 }
      node = node[branch]!
    }
    node.count += 1
    await runtime.range(index, highestBit)
  }
  let output = 0
  const visit = async (
    node: BinaryTrieNode | undefined,
    bit: number,
    value: number,
  ): Promise<void> => {
    if (!node) return
    if (bit < 0) {
      for (let count = 0; count < node.count; count += 1)
        await runtime.write(output++, value - offset)
      return
    }
    await visit(node.zero, bit - 1, value)
    await visit(node.one, bit - 1, value | (2 ** bit))
  }
  await visit(root, highestBit, 0)
}

async function bucketSort(runtime: SandboxSortRuntime) {
  if (runtime.values.length < 2) return
  const minimum = Math.min(...runtime.values)
  const maximum = Math.max(...runtime.values)
  const count = Math.max(2, Math.ceil(Math.sqrt(runtime.values.length)))
  const buckets = Array.from({ length: count }, () => [] as number[])
  for (let index = 0; index < runtime.values.length; index += 1) {
    const bucket =
      maximum === minimum
        ? 0
        : Math.min(
            count - 1,
            Math.floor(((runtime.values[index] - minimum) / (maximum - minimum)) * count),
          )
    buckets[bucket].push(runtime.values[index])
    await runtime.range(index, bucket)
  }
  let target = 0
  for (const bucket of buckets) {
    for (let index = 1; index < bucket.length; index += 1) {
      const value = bucket[index]
      let current = index - 1
      while (current >= 0 && bucket[current] > value) {
        bucket[current + 1] = bucket[current]
        current -= 1
      }
      bucket[current + 1] = value
    }
    for (const value of bucket) await runtime.write(target++, value)
  }
}

async function sampleSort(runtime: SandboxSortRuntime) {
  const count = Math.max(2, Math.ceil(Math.sqrt(runtime.values.length)))
  const sample = [...runtime.values].sort((left, right) => left - right)
  const splitters = Array.from(
    { length: count - 1 },
    (_, index) => sample[Math.floor(((index + 1) * sample.length) / count)],
  )
  const buckets = Array.from({ length: count }, () => [] as number[])
  for (let index = 0; index < runtime.values.length; index += 1) {
    let bucket = 0
    while (bucket < splitters.length && runtime.values[index] > splitters[bucket]) bucket += 1
    buckets[bucket].push(runtime.values[index])
    await runtime.range(index, bucket)
  }
  let target = 0
  for (const bucket of buckets) {
    bucket.sort((left, right) => left - right)
    for (const value of bucket) await runtime.write(target++, value)
  }
}

async function flashSort(runtime: SandboxSortRuntime) {
  if (runtime.values.length < 2) return
  const minimum = Math.min(...runtime.values)
  const maximum = Math.max(...runtime.values)
  if (minimum === maximum) return
  const classes = Math.max(2, Math.floor(runtime.values.length * 0.43))
  const counts = new Uint32Array(classes)
  const classOf = (value: number) =>
    Math.min(classes - 1, Math.floor(((value - minimum) * (classes - 1)) / (maximum - minimum)))
  for (const value of runtime.values) counts[classOf(value)] += 1
  for (let index = 1; index < counts.length; index += 1) counts[index] += counts[index - 1]
  const output = Array(runtime.values.length) as number[]
  for (let index = runtime.values.length - 1; index >= 0; index -= 1)
    output[--counts[classOf(runtime.values[index])]] = runtime.values[index]
  for (let index = 0; index < output.length; index += 1) await runtime.write(index, output[index])
  await insertionRange(runtime)
}

async function bitonicSort(runtime: SandboxSortRuntime) {
  for (let size = 2; size <= runtime.values.length; size *= 2) {
    for (let stride = size / 2; stride > 0; stride = Math.floor(stride / 2)) {
      for (let index = 0; index < runtime.values.length; index += 1) {
        const partner = index ^ stride
        if (partner <= index) continue
        await runtime.compare(index, partner)
        const ascending = (index & size) === 0
        if (runtime.values[index] > runtime.values[partner] === ascending)
          await runtime.swap(index, partner)
      }
    }
  }
}

function oddEvenNetworkPairs(length: number) {
  const pairs: Array<[number, number]> = []
  const merge = (low: number, count: number, stride: number) => {
    const step = stride * 2
    if (step < count) {
      merge(low, count, step)
      merge(low + stride, count, step)
      for (let index = low + stride; index + stride < low + count; index += step)
        pairs.push([index, index + stride])
    } else if (low + stride < low + count) pairs.push([low, low + stride])
  }
  const sort = (low: number, count: number) => {
    if (count <= 1) return
    const middle = Math.floor(count / 2)
    sort(low, middle)
    sort(low + middle, count - middle)
    merge(low, count, 1)
  }
  sort(0, length)
  return pairs
}

const minimumNetwork16: Array<Array<[number, number]>> = [
  [
    [0, 13],
    [1, 12],
    [2, 15],
    [3, 14],
    [4, 8],
    [5, 6],
    [7, 11],
    [9, 10],
  ],
  [
    [0, 5],
    [1, 7],
    [2, 9],
    [3, 4],
    [6, 13],
    [8, 14],
    [10, 15],
    [11, 12],
  ],
  [
    [0, 1],
    [2, 3],
    [4, 5],
    [6, 8],
    [7, 9],
    [10, 11],
    [12, 13],
    [14, 15],
  ],
  [
    [0, 2],
    [1, 3],
    [4, 10],
    [5, 11],
    [6, 7],
    [8, 9],
    [12, 14],
    [13, 15],
  ],
  [
    [1, 2],
    [3, 12],
    [4, 6],
    [5, 7],
    [8, 10],
    [9, 11],
    [13, 14],
  ],
  [
    [1, 4],
    [2, 6],
    [5, 8],
    [7, 10],
    [9, 13],
    [11, 14],
  ],
  [
    [2, 4],
    [3, 6],
    [9, 12],
    [11, 13],
  ],
  [
    [3, 5],
    [6, 8],
    [7, 9],
    [10, 12],
  ],
  [
    [3, 4],
    [5, 6],
    [7, 8],
    [9, 10],
    [11, 12],
  ],
  [
    [6, 7],
    [8, 9],
  ],
]

async function runNetwork(runtime: SandboxSortRuntime, pairs: Iterable<[number, number]>) {
  for (const [left, right] of pairs) {
    await runtime.compare(left, right)
    if (runtime.values[left] > runtime.values[right]) await runtime.swap(left, right)
  }
}

async function stoogeSort(runtime: SandboxSortRuntime) {
  const sort = async (left: number, right: number): Promise<void> => {
    await runtime.compare(left, right)
    if (runtime.values[left] > runtime.values[right]) await runtime.swap(left, right)
    if (right - left + 1 > 2) {
      const third = Math.floor((right - left + 1) / 3)
      await sort(left, right - third)
      await sort(left + third, right)
      await sort(left, right - third)
    }
  }
  if (runtime.values.length) await sort(0, runtime.values.length - 1)
}

async function slowSort(runtime: SandboxSortRuntime) {
  const sort = async (left: number, right: number): Promise<void> => {
    if (left >= right) return
    const middle = Math.floor((left + right) / 2)
    await sort(left, middle)
    await sort(middle + 1, right)
    await runtime.compare(middle, right)
    if (runtime.values[middle] > runtime.values[right]) await runtime.swap(middle, right)
    await sort(left, right - 1)
  }
  await sort(0, runtime.values.length - 1)
}

function nextPermutation(values: number[]) {
  let pivot = values.length - 2
  while (pivot >= 0 && values[pivot] >= values[pivot + 1]) pivot -= 1
  if (pivot < 0) return false
  let successor = values.length - 1
  while (values[successor] <= values[pivot]) successor -= 1
  ;[values[pivot], values[successor]] = [values[successor], values[pivot]]
  for (let left = pivot + 1, right = values.length - 1; left < right; left += 1, right -= 1)
    [values[left], values[right]] = [values[right], values[left]]
  return true
}

async function permutationSort(runtime: SandboxSortRuntime, randomize: boolean) {
  const random = deterministicRandom(runtime.values)
  const isSorted = () =>
    runtime.values.every((value, index) => index === 0 || runtime.values[index - 1] <= value)
  let attempts = 0
  while (!isSorted() && attempts < 50_000) {
    if (randomize) {
      for (let index = runtime.values.length - 1; index > 0; index -= 1)
        await runtime.swap(index, Math.floor(random() * (index + 1)))
    } else {
      const next = [...runtime.values]
      if (!nextPermutation(next)) next.sort((left, right) => left - right)
      for (let index = 0; index < next.length; index += 1)
        if (next[index] !== runtime.values[index]) await runtime.write(index, next[index])
    }
    attempts += 1
  }
  if (!isSorted()) await insertionRange(runtime)
}

async function bozoSort(runtime: SandboxSortRuntime) {
  const random = deterministicRandom(runtime.values)
  const sorted = () =>
    runtime.values.every((value, index) => index === 0 || runtime.values[index - 1] <= value)
  for (let attempts = 0; !sorted() && attempts < 100_000; attempts += 1) {
    const left = Math.floor(random() * runtime.values.length)
    const right = Math.floor(random() * runtime.values.length)
    if (left !== right) await runtime.swap(left, right)
  }
  if (!sorted()) await insertionRange(runtime)
}

async function sleepSort(runtime: SandboxSortRuntime) {
  const scheduled = runtime.values
    .map((value, index) => ({ value, index }))
    .sort((left, right) => left.value - right.value || left.index - right.index)
  for (const item of scheduled) await runtime.range(item.index, item.index)
  for (let index = 0; index < scheduled.length; index += 1)
    await runtime.write(index, scheduled[index].value)
}

async function beadSort(runtime: SandboxSortRuntime) {
  if (!runtime.values.length) return
  const minimum = Math.min(...runtime.values)
  const offset = minimum < 0 ? -minimum : 0
  const shifted = runtime.values.map((value) => value + offset)
  const columns = new Uint32Array(Math.max(...shifted))
  for (let row = 0; row < shifted.length; row += 1) {
    for (let column = 0; column < shifted[row]; column += 1) columns[column] += 1
    await runtime.range(row, Math.max(0, shifted[row] - 1))
  }
  for (let row = 0; row < shifted.length; row += 1) {
    const threshold = shifted.length - row
    let value = 0
    for (const height of columns) if (height >= threshold) value += 1
    await runtime.write(row, value - offset)
  }
}

export async function runBrowserImplementation(id: string, runtime: SandboxSortRuntime) {
  if (id === 'bubble' || id === 'bubble-optimized')
    return bubbleSort(runtime, id === 'bubble-optimized')
  if (id === 'cocktail-shaker-sort') return cocktailSort(runtime)
  if (id === 'odd-even-transposition-sort') return oddEvenSort(runtime)
  if (id === 'comb-sort') return combSort(runtime)
  if (id === 'gnome-sort') return gnomeSort(runtime)
  if (id === 'exchange-sort') return exchangeSort(runtime)
  if (id === 'restart-sort') return restartSort(runtime)
  if (id === 'random-adjacent-swap-sort') return randomExchange(runtime, true)
  if (id === 'spin-the-bottle-sort' || id === 'random-swap-sort' || id === 'random-pair-sort')
    return randomExchange(runtime, false)
  if (id === 'annealing-sort') return annealingSort(runtime)
  if (id === 'selection') return selectionSort(runtime)
  if (id === 'double-selection-sort') return doubleSelectionSort(runtime)
  if (id === 'bingo-sort') return bingoSort(runtime)
  if (id === 'insertion') return insertionRange(runtime)
  if (id === 'binary-insertion-sort') return binaryInsertionSort(runtime)
  if (id === 'pair-insertion-sort') return pairInsertionSort(runtime)
  if (id === 'cycle-sort') return cycleSort(runtime)
  if (id === 'pancake-sort') return pancakeSort(runtime)
  if (id === 'rank-sort') return rankSort(runtime)
  if (id === 'tag-sort') return tagSort(runtime)
  if (id === 'patience-sort') return patienceSort(runtime)
  if (id === 'library-sort') return librarySort(runtime)
  if (id === 'strand-sort') return strandSort(runtime)
  if (id === 'tournament-sort') return tournamentSort(runtime)
  if (id === 'shell' || id.startsWith('shell-sort-')) return shellSort(runtime, id)
  if (id === 'heap' || id === 'bottom-up-heapsort') return heapSort(runtime)
  if (id === 'ternary-heapsort') return heapSort(runtime, 3)
  if (id === 'd-ary-heapsort') return heapSort(runtime, 4)
  if (id === 'tree-sort') return treeSort(runtime)
  if (id === 'avl-tree-sort') return avlTreeSort(runtime)
  if (id === 'red-black-tree-sort') return redBlackTreeSort(runtime)
  if (id === 'splay-sort') return splayTreeSort(runtime)
  if (id === 'cartesian-tree-sort') return cartesianTreeSort(runtime)
  if (id === 'stable-quicksort') return stableQuickSort(runtime)
  if (id === 'introsort') return introSort(runtime)
  if (id.includes('quick')) return quickSort(runtime, id)
  if (id === 'merge-bottom-up' || id === 'two-way-merge-sort' || id === 'ping-pong-merge-sort')
    return bottomUpMergeSort(runtime)
  if (id === 'merge' || id === 'three-way-merge-sort')
    return id === 'three-way-merge-sort' ? kWayMergeSort(runtime, 3) : topDownMergeSort(runtime)
  if (id === 'k-way-merge-sort') return kWayMergeSort(runtime, 4)
  if (id === 'natural-merge-sort') return naturalMergeSort(runtime)
  if (id === 'timsort') return timSort(runtime)
  if (id === 'in-place-merge-sort') return inPlaceMergeSort(runtime)
  if (id === 'rotation-merge-sort') return rotationMergeSort(runtime)
  if (id === 'merge-insertion-sort') {
    await insertionRange(runtime)
    return
  }
  if (id === 'counting' || id === 'pigeonhole-sort' || id === 'histogram-sort')
    return countingSort(runtime, false)
  if (id === 'stable-counting-sort' || id === 'key-indexed-counting-sort')
    return countingSort(runtime, true)
  if (id === 'radix-lsd' || id === 'base-10-radix-sort') return radixSort(runtime, 10)
  if (id === 'base-4-radix-sort') return radixSort(runtime, 4)
  if (id === 'base-8-radix-sort') return radixSort(runtime, 8)
  if (id === 'base-16-radix-sort') return radixSort(runtime, 16)
  if (id === 'base-256-radix-sort') return radixSort(runtime, 256)
  if (id === 'msd-radix-sort') return msdRadixSort(runtime)
  if (id === 'binary-radix-sort') return binaryRadixSort(runtime)
  if (id === 'american-flag-sort' || id === 'in-place-radix-sort') return americanFlagSort(runtime)
  if (id === 'radix-exchange-sort') return radixExchangeSort(runtime)
  if (id === 'trie-sort') return trieSort(runtime)
  if (id === 'bucket-sort') return bucketSort(runtime)
  if (id === 'sample-sort') return sampleSort(runtime)
  if (id === 'flashsort') return flashSort(runtime)
  if (id === 'bitonic') return bitonicSort(runtime)
  if (id === 'batcher-odd-even-mergesort')
    return runNetwork(runtime, oddEvenNetworkPairs(runtime.values.length))
  if (id === 'minimum-comparator-networks-for-small-arrays') {
    if (runtime.values.length !== 16)
      throw new Error('The fixed minimum-comparator schedule currently supports exactly 16 values.')
    return runNetwork(runtime, minimumNetwork16.flat())
  }
  if (id === 'stooge') return stoogeSort(runtime)
  if (id === 'slow') return slowSort(runtime)
  if (id === 'bogo') return permutationSort(runtime, true)
  if (id === 'deterministic-permutation-sort') return permutationSort(runtime, false)
  if (id === 'bozosort') return bozoSort(runtime)
  if (id === 'sleep-sort') return sleepSort(runtime)
  if (id === 'bead-sort') return beadSort(runtime)
  throw new Error(`No browser implementation is registered for ${id}.`)
}
