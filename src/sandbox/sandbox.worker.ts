/// <reference lib="webworker" />

import type { SandboxOperation } from './types'
import type {
  SandboxWorkerRequest,
  SandboxWorkerResponse,
  SandboxWorkerStats,
} from './workerProtocol'

const worker = self as unknown as DedicatedWorkerGlobalScope
let activeRun = 0
let acknowledge: (() => void) | null = null

class OperationEmitter {
  readonly stats: SandboxWorkerStats = { comparisons: 0, swaps: 0, writes: 0, operations: 0 }
  private batch: SandboxOperation[] = []

  constructor(
    private readonly runId: number,
    private readonly batchSize: number,
    private readonly operationBudget: number,
  ) {}

  async emit(operation: SandboxOperation) {
    if (this.runId !== activeRun) throw new Error('canceled')
    if (this.stats.operations >= this.operationBudget)
      throw new Error('The operation safety limit stopped this run. Choose a smaller amount.')
    this.batch.push(operation)
    this.stats.operations += 1
    if (operation[0] === 0) this.stats.comparisons += 1
    else if (operation[0] === 1) this.stats.swaps += 1
    else if (operation[0] === 2) this.stats.writes += 1
    if (this.batch.length >= this.batchSize) await this.flush()
  }

  async flush() {
    if (this.batch.length === 0) return
    const message: SandboxWorkerResponse = {
      type: 'batch',
      runId: this.runId,
      operations: this.batch,
      stats: { ...this.stats },
    }
    worker.postMessage(message)
    this.batch = []
    await new Promise<void>((resolve) => {
      acknowledge = resolve
    })
    if (this.runId !== activeRun) throw new Error('canceled')
  }
}

async function compare(emitter: OperationEmitter, left: number, right: number) {
  await emitter.emit([0, left, right])
}

async function swap(values: number[], emitter: OperationEmitter, left: number, right: number) {
  ;[values[left], values[right]] = [values[right], values[left]]
  await emitter.emit([1, left, right])
}

async function write(values: number[], emitter: OperationEmitter, index: number, value: number) {
  values[index] = value
  await emitter.emit([2, index, value])
}

async function quickSort(
  values: number[],
  emitter: OperationEmitter,
  left = 0,
  right = values.length - 1,
) {
  if (left >= right) return
  const pivotIndex = Math.floor((left + right) / 2)
  const pivot = values[pivotIndex]
  await emitter.emit([3, pivotIndex, pivot])
  let i = left
  let j = right
  while (i <= j) {
    while (i <= right) {
      await compare(emitter, i, pivotIndex)
      if (values[i] >= pivot) break
      i += 1
    }
    while (j >= left) {
      await compare(emitter, j, pivotIndex)
      if (values[j] <= pivot) break
      j -= 1
    }
    if (i <= j) {
      if (i !== j) await swap(values, emitter, i, j)
      i += 1
      j -= 1
    }
  }
  if (left < j) await quickSort(values, emitter, left, j)
  if (i < right) await quickSort(values, emitter, i, right)
}

async function mergeSort(values: number[], emitter: OperationEmitter) {
  const buffer = [...values]
  for (let width = 1; width < values.length; width *= 2) {
    for (let left = 0; left < values.length; left += width * 2) {
      const middle = Math.min(left + width, values.length)
      const right = Math.min(left + width * 2, values.length)
      let i = left
      let j = middle
      let target = left
      while (i < middle || j < right) {
        if (i < middle && j < right) await compare(emitter, i, j)
        if (j >= right || (i < middle && values[i] <= values[j])) buffer[target++] = values[i++]
        else buffer[target++] = values[j++]
      }
      for (let index = left; index < right; index += 1) {
        if (values[index] !== buffer[index]) await write(values, emitter, index, buffer[index])
      }
    }
  }
}

async function heapSort(values: number[], emitter: OperationEmitter) {
  const sift = async (length: number, root: number) => {
    let current = root
    while (true) {
      let largest = current
      const left = current * 2 + 1
      const right = left + 1
      if (left < length) {
        await compare(emitter, left, largest)
        if (values[left] > values[largest]) largest = left
      }
      if (right < length) {
        await compare(emitter, right, largest)
        if (values[right] > values[largest]) largest = right
      }
      if (largest === current) return
      await swap(values, emitter, current, largest)
      current = largest
    }
  }
  for (let index = Math.floor(values.length / 2) - 1; index >= 0; index -= 1)
    await sift(values.length, index)
  for (let end = values.length - 1; end > 0; end -= 1) {
    await swap(values, emitter, 0, end)
    await sift(end, 0)
  }
}

async function insertionSort(values: number[], emitter: OperationEmitter) {
  for (let index = 1; index < values.length; index += 1) {
    const key = values[index]
    let current = index - 1
    while (current >= 0) {
      await compare(emitter, current, index)
      if (values[current] <= key) break
      await write(values, emitter, current + 1, values[current])
      current -= 1
    }
    if (current + 1 !== index) await write(values, emitter, current + 1, key)
  }
}

async function bubbleSort(values: number[], emitter: OperationEmitter) {
  for (let end = values.length - 1; end > 0; end -= 1) {
    let changed = false
    for (let index = 0; index < end; index += 1) {
      await compare(emitter, index, index + 1)
      if (values[index] > values[index + 1]) {
        await swap(values, emitter, index, index + 1)
        changed = true
      }
    }
    if (!changed) return
  }
}

async function selectionSort(values: number[], emitter: OperationEmitter) {
  for (let start = 0; start < values.length - 1; start += 1) {
    let minimum = start
    for (let index = start + 1; index < values.length; index += 1) {
      await compare(emitter, minimum, index)
      if (values[index] < values[minimum]) minimum = index
    }
    if (minimum !== start) await swap(values, emitter, start, minimum)
  }
}

async function shellSort(values: number[], emitter: OperationEmitter) {
  for (let gap = Math.floor(values.length / 2); gap > 0; gap = Math.floor(gap / 2)) {
    for (let index = gap; index < values.length; index += 1) {
      const value = values[index]
      let current = index
      while (current >= gap) {
        await compare(emitter, current - gap, index)
        if (values[current - gap] <= value) break
        await write(values, emitter, current, values[current - gap])
        current -= gap
      }
      if (current !== index) await write(values, emitter, current, value)
    }
  }
}

async function countingSort(values: number[], emitter: OperationEmitter) {
  let minimum = values[0]
  let maximum = values[0]
  for (const value of values) {
    minimum = Math.min(minimum, value)
    maximum = Math.max(maximum, value)
  }
  const counts = new Uint32Array(maximum - minimum + 1)
  for (const value of values) counts[value - minimum] += 1
  let index = 0
  for (let offset = 0; offset < counts.length; offset += 1) {
    for (let count = 0; count < counts[offset]; count += 1) {
      await write(values, emitter, index++, offset + minimum)
    }
  }
}

async function radixSort(values: number[], emitter: OperationEmitter) {
  let maximum = 0
  for (const value of values) maximum = Math.max(maximum, Math.abs(value))
  const minimum = Math.min(...values)
  const offset = minimum < 0 ? -minimum : 0
  const working = values.map((value) => value + offset)
  maximum += offset
  const output = new Array<number>(values.length)
  for (let exponent = 1; Math.floor(maximum / exponent) > 0; exponent *= 10) {
    const counts = new Uint32Array(10)
    for (const value of working) counts[Math.floor(value / exponent) % 10] += 1
    for (let index = 1; index < 10; index += 1) counts[index] += counts[index - 1]
    for (let index = working.length - 1; index >= 0; index -= 1) {
      const digit = Math.floor(working[index] / exponent) % 10
      output[--counts[digit]] = working[index]
    }
    for (let index = 0; index < working.length; index += 1) {
      working[index] = output[index]
      await write(values, emitter, index, output[index] - offset)
    }
  }
}

async function bitonicSort(values: number[], emitter: OperationEmitter) {
  for (let size = 2; size <= values.length; size *= 2) {
    for (let stride = size / 2; stride > 0; stride = Math.floor(stride / 2)) {
      for (let index = 0; index < values.length; index += 1) {
        const partner = index ^ stride
        if (partner <= index) continue
        await compare(emitter, index, partner)
        const ascending = (index & size) === 0
        if (values[index] > values[partner] === ascending)
          await swap(values, emitter, index, partner)
      }
    }
  }
}

async function run(request: Extract<SandboxWorkerRequest, { type: 'start' }>) {
  activeRun = request.runId
  const values = [...request.values]
  const emitter = new OperationEmitter(request.runId, request.batchSize, request.operationBudget)
  try {
    if (request.algorithm === 'quick') await quickSort(values, emitter)
    else if (request.algorithm === 'merge') await mergeSort(values, emitter)
    else if (request.algorithm === 'heap') await heapSort(values, emitter)
    else if (request.algorithm === 'radix') await radixSort(values, emitter)
    else if (request.algorithm === 'counting') await countingSort(values, emitter)
    else if (request.algorithm === 'shell') await shellSort(values, emitter)
    else if (request.algorithm === 'bubble') await bubbleSort(values, emitter)
    else if (request.algorithm === 'selection') await selectionSort(values, emitter)
    else if (request.algorithm === 'insertion') await insertionSort(values, emitter)
    else await bitonicSort(values, emitter)
    await emitter.flush()
    worker.postMessage({
      type: 'complete',
      runId: request.runId,
      stats: emitter.stats,
    } satisfies SandboxWorkerResponse)
  } catch (error) {
    worker.postMessage(
      error instanceof Error && error.message === 'canceled'
        ? ({ type: 'canceled', runId: request.runId } satisfies SandboxWorkerResponse)
        : ({
            type: 'error',
            runId: request.runId,
            message: error instanceof Error ? error.message : 'Sandbox worker failed.',
          } satisfies SandboxWorkerResponse),
    )
  }
}

worker.onmessage = (event: MessageEvent<SandboxWorkerRequest>) => {
  const request = event.data
  if (request.type === 'ack' && request.runId === activeRun) {
    acknowledge?.()
    acknowledge = null
  } else if (request.type === 'cancel' && request.runId === activeRun) {
    activeRun += 1
    acknowledge?.()
    acknowledge = null
  } else if (request.type === 'start') {
    void run(request)
  }
}
