import { describe, expect, it } from 'vitest'
import {
  hasBrowserImplementation,
  runBrowserImplementation,
  type SandboxSortRuntime,
} from '../sandbox/browserImplementations'
import { sandboxAlgorithms } from '../sandbox/config'

class TestRuntime implements SandboxSortRuntime {
  operations = 0

  constructor(public values: number[]) {}

  async compare() {
    this.operations += 1
  }

  async swap(left: number, right: number) {
    ;[this.values[left], this.values[right]] = [this.values[right], this.values[left]]
    this.operations += 1
  }

  async write(index: number, value: number) {
    this.values[index] = value
    this.operations += 1
  }

  async pivot() {
    this.operations += 1
  }

  async range() {
    this.operations += 1
  }
}

describe('Sandbox browser implementation registry', () => {
  it('sorts a deterministic array with every algorithm labeled as actual or parameterized', async () => {
    const implementations = sandboxAlgorithms.filter((algorithm) => algorithm.implementationId)
    expect(implementations.length).toBeGreaterThan(100)

    for (const algorithm of implementations) {
      const amount = algorithm.exactAmount ?? 16
      const input = Array.from({ length: amount }, (_, index) => amount - index)
      const expected = [...input].sort((left, right) => left - right)
      const runtime = new TestRuntime([...input])
      expect(hasBrowserImplementation(algorithm.id), algorithm.id).toBe(true)
      await runBrowserImplementation(algorithm.implementationId!, runtime)
      expect(runtime.values, algorithm.id).toEqual(expected)
      expect(runtime.operations, algorithm.id).toBeGreaterThan(0)
    }
  }, 30_000)

  it('never labels a fallback-only catalog entry as an actual implementation', () => {
    for (const algorithm of sandboxAlgorithms) {
      if (algorithm.fidelity === 'simulation') expect(algorithm.implementationId).toBeUndefined()
      else expect(algorithm.implementationId).toBe(algorithm.id)
    }
  })

  it('handles duplicates and signed values across practical implementations', async () => {
    const intentionallyBounded =
      /(bogo|bozo|random|spin-the-bottle|annealing|stooge|slow|sleep|bead)/
    const implementations = sandboxAlgorithms.filter(
      (algorithm) =>
        algorithm.implementationId &&
        !intentionallyBounded.test(algorithm.id) &&
        !algorithm.tags.includes('Pathological'),
    )
    for (const algorithm of implementations) {
      const amount = algorithm.exactAmount ?? 16
      const pattern = [-7, 3, 0, 3, -2, 8, 1, -7]
      const input = Array.from({ length: amount }, (_, index) => pattern[index % pattern.length])
      const runtime = new TestRuntime([...input])
      await runBrowserImplementation(algorithm.implementationId!, runtime)
      expect(runtime.values, algorithm.id).toEqual([...input].sort((left, right) => left - right))
    }
  }, 30_000)
})
