import { describe, expect, it } from 'vitest'
import { algorithmImplementations, materializeEvents } from '../algorithms/engine'
import {
  algorithmRegistry,
  validateAlgorithmInput,
  visualizeAlgorithmRegistry,
} from '../algorithms/registry'
import { valueToFrequency } from '../audio/frequencyMapping'
import { CancellationToken } from '../benchmark/control'
import { clampStep, resetPlayback, togglePlayback } from '../playback/state'
import { generateArray, isSorted, parseCustomInput, sameMultiset } from '../utils/array'

const standardCases = [
  [],
  [1],
  [3, 1, 2],
  [4, 4, 1, 2, 1],
  [-3, 8, 0, -3, 2],
  [1, 2, 3, 4, 5],
  [5, 4, 3, 2, 1],
]

describe('sorting algorithm catalog', () => {
  for (const algorithm of algorithmRegistry) {
    it(`${algorithm.name} sorts supported inputs and preserves the multiset`, () => {
      const implementation = algorithmImplementations[algorithm.id]
      expect(implementation).toBeTypeOf('function')
      const cases =
        algorithm.family === 'Network'
          ? [
              [8, 3, 7, 4, 9, 2, 6, 1],
              [4, 4, -1, 2, 9, 0, 2, 1],
            ]
          : standardCases
      for (const input of cases) {
        const { result } = materializeEvents(algorithm.id, input)
        expect(isSorted(result)).toBe(true)
        expect(sameMultiset(input, result)).toBe(true)
      }
      for (let seed = 1; seed <= 4; seed += 1) {
        const input = generateArray(
          'random',
          algorithm.family === 'Network' ? 8 : Math.min(12, algorithm.hardMax),
          seed,
        )
        const { result } = materializeEvents(algorithm.id, input)
        expect(isSorted(result)).toBe(true)
        expect(sameMultiset(input, result)).toBe(true)
      }
    })
  }

  it('metadata is complete and pseudocode line ids are usable', () => {
    expect(algorithmRegistry.length).toBeGreaterThanOrEqual(35)
    for (const algorithm of algorithmRegistry) {
      expect(algorithm.id).toBeTruthy()
      expect(algorithm.shortDescription.length).toBeGreaterThan(10)
      expect(algorithm.pseudocode.length).toBeGreaterThan(0)
      expect(algorithm.hardMax).toBeGreaterThan(0)
      expect(/O|unbounded|super-polynomial/.test(algorithm.complexity.worst)).toBe(true)
    }
  })

  it('keeps Visualize curated at 44 meaningfully distinct algorithms', () => {
    expect(visualizeAlgorithmRegistry).toHaveLength(44)
    expect(visualizeAlgorithmRegistry.map((algorithm) => algorithm.id)).toContain(
      'parallel-merge-simulated',
    )
    expect(visualizeAlgorithmRegistry.map((algorithm) => algorithm.id)).not.toContain(
      'quick-lomuto',
    )
  })

  it('events include snapshots and monotonic operation counters', () => {
    const { events } = materializeEvents('bubble', [4, 1, 3, 2])
    expect(events.at(-1)?.type).toBe('markSorted')
    for (let index = 1; index < events.length; index += 1) {
      expect(events[index].array).not.toBe(events[index - 1].array)
      expect(events[index].stats.comparisons).toBeGreaterThanOrEqual(
        events[index - 1].stats.comparisons,
      )
      expect(events[index].stats.writes).toBeGreaterThanOrEqual(events[index - 1].stats.writes)
    }
  })
})

describe('inputs, playback, benchmark cancellation, and audio', () => {
  it('parses custom input and reports invalid values', () => {
    expect(parseCustomInput('5, -1, 3, 3, 9')).toEqual([5, -1, 3, 3, 9])
    expect(() => parseCustomInput('1, two, 3, 4, 5')).toThrow(/integers/i)
    expect(() => parseCustomInput('1,2,3')).toThrow(/at least five/i)
  })

  it('generates reproducible seeded arrays across modes', () => {
    expect(generateArray('random', 20, 42)).toEqual(generateArray('random', 20, 42))
    expect(generateArray('random', 20, 42)).not.toEqual(generateArray('random', 20, 43))
    expect(isSorted(generateArray('sorted', 20, 42))).toBe(true)
  })

  it('enforces algorithm limits and network restrictions', () => {
    expect(validateAlgorithmInput('bogo', Array(9).fill(1))).toMatch(/limited/i)
    expect(validateAlgorithmInput('bitonic', Array(10).fill(1))).toMatch(/power-of-two/i)
    expect(validateAlgorithmInput('counting', [0, 6000])).toMatch(/range/i)
  })

  it('supports pause, resume, reset, forward, and backward state transitions', () => {
    expect(togglePlayback('running')).toBe('paused')
    expect(togglePlayback('paused')).toBe('running')
    expect(clampStep(3, -1, 8)).toBe(2)
    expect(clampStep(-1, 1, 8)).toBe(0)
    expect(clampStep(7, 1, 8)).toBe(7)
    expect(resetPlayback()).toEqual({ status: 'idle', eventIndex: -1 })
  })

  it('exposes a resettable cancellation token for worker checkpoints', () => {
    const token = new CancellationToken()
    expect(token.isCanceled).toBe(false)
    token.cancel()
    expect(token.isCanceled).toBe(true)
    token.reset()
    expect(token.isCanceled).toBe(false)
  })

  it('maps values into a controlled musical range', () => {
    expect(valueToFrequency(0, 0, 100)).toBeCloseTo(120)
    expect(valueToFrequency(100, 0, 100)).toBeCloseTo(1212)
    expect(valueToFrequency(50, 50, 50)).toBeCloseTo(666)
  })
})
