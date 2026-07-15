import { describe, expect, it } from 'vitest'
import {
  completionSweepDuration,
  defaultSandboxPreferences,
  estimateSandboxOperations,
  excludedSandboxAlgorithms,
  isPowerOfTwo,
  operationsPerFrame,
  sandboxAlgorithms,
  sandboxAmountRestriction,
  sandboxVisualPresets,
} from '../sandbox/config'
import { nextHiddenInterface, sandboxShortcutAction } from '../sandbox/controls'
import { OperationQueue } from '../sandbox/operationQueue'
import {
  loadSandboxPreferences,
  SANDBOX_PREFERENCES_KEY,
  saveSandboxPreferences,
} from '../sandbox/preferences'
import { isSandboxWorkerResponse } from '../sandbox/workerProtocol'

describe('Sandbox algorithm and amount policy', () => {
  it('publishes categorized, implemented algorithms without pathological choices', () => {
    expect(sandboxAlgorithms.length).toBeGreaterThanOrEqual(10)
    expect(sandboxAlgorithms.some((algorithm) => algorithm.group === 'Recommended')).toBe(true)
    for (const excluded of excludedSandboxAlgorithms)
      expect(sandboxAlgorithms.some((algorithm) => algorithm.id === excluded)).toBe(false)
  })

  it('applies complexity-based limits and explains blocked amounts', () => {
    expect(sandboxAmountRestriction('bubble-optimized', 512)).toBeNull()
    expect(sandboxAmountRestriction('bubble-optimized', 1024)).toMatch(/limited to 512/i)
    expect(sandboxAmountRestriction('merge', 4096)).toBeNull()
    expect(sandboxAmountRestriction('unknown', 64)).toMatch(/not available/i)
  })

  it('enforces power-of-two rules for sorting networks', () => {
    expect(isPowerOfTwo(1024)).toBe(true)
    expect(isPowerOfTwo(1000)).toBe(false)
    expect(sandboxAmountRestriction('bitonic', 1000)).toMatch(/power-of-two/i)
  })

  it('scales operation estimates and playback batches by mode', () => {
    expect(estimateSandboxOperations('bubble-optimized', 256)).toBeGreaterThan(
      estimateSandboxOperations('merge', 256),
    )
    expect(operationsPerFrame('realtime', 60)).toBeLessThan(operationsPerFrame('fast', 60))
    expect(operationsPerFrame('fast', 60)).toBeLessThan(operationsPerFrame('maximum', 60))
  })
})

describe('Sandbox registries, queue, and worker protocol', () => {
  it('defines all six visual presets with complete colors', () => {
    expect(Object.keys(sandboxVisualPresets)).toEqual([
      'classic',
      'neon',
      'monochrome',
      'heatmap',
      'spectrum',
      'terminal',
    ])
    for (const preset of Object.values(sandboxVisualPresets)) {
      expect(preset.background).toMatch(/^#/)
      expect(preset.active).toMatch(/^#/)
      expect(preset.sorted).toMatch(/^#/)
    }
  })

  it('batches, drains, backpressures, and cancels a bounded queue', () => {
    const queue = new OperationQueue(4, 2)
    queue.push([
      [0, 0, 1],
      [1, 0, 1],
      [2, 1, 8],
      [3, 1, 8],
    ])
    expect(queue.needsBackpressure).toBe(true)
    expect(queue.drain(2)).toHaveLength(2)
    expect(queue.canReleaseBackpressure).toBe(true)
    queue.clear()
    expect(queue.size).toBe(0)
  })

  it('validates compact worker response messages', () => {
    expect(
      isSandboxWorkerResponse({
        type: 'batch',
        runId: 1,
        operations: [[0, 0, 1]],
        stats: { comparisons: 1, swaps: 0, writes: 0, operations: 1 },
      }),
    ).toBe(true)
    expect(isSandboxWorkerResponse({ type: 'start', runId: 1 })).toBe(false)
    expect(isSandboxWorkerResponse(null)).toBe(false)
  })
})

describe('Sandbox preferences, presentation state, and completion', () => {
  it('persists validated Sandbox preferences without hidden-interface state', () => {
    const values = new Map<string, string>()
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    }
    const preferences = {
      ...defaultSandboxPreferences,
      amount: 2048,
      visual: { ...defaultSandboxPreferences.visual, preset: 'terminal' as const },
    }
    saveSandboxPreferences(preferences, storage)
    expect(values.has(SANDBOX_PREFERENCES_KEY)).toBe(true)
    expect(loadSandboxPreferences(storage)).toMatchObject({
      amount: 2048,
      visual: { preset: 'terminal' },
    })
    expect(values.get(SANDBOX_PREFERENCES_KEY)).not.toContain('interfaceHidden')
  })

  it('maps keyboard shortcuts and always restores a hidden interface', () => {
    expect(sandboxShortcutAction(' ', 'Space')).toBe('toggle-playback')
    expect(sandboxShortcutAction('h')).toBe('toggle-interface')
    expect(sandboxShortcutAction('Escape', '', true)).toBe('restore-interface')
    expect(nextHiddenInterface(true, 'restore-interface')).toBe(false)
    expect(nextHiddenInterface(false, 'toggle-interface')).toBe(true)
  })

  it('bounds completion sweep timing as arrays scale', () => {
    expect(completionSweepDuration(64)).toBeGreaterThanOrEqual(650)
    expect(completionSweepDuration(4096)).toBeGreaterThan(completionSweepDuration(256))
    expect(completionSweepDuration(100_000)).toBeLessThanOrEqual(2200)
  })
})
