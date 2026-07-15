import { algorithmById } from '../algorithms/registry'
import { createAudioSettings } from '../audio/presets'
import type { SandboxPreferences, SandboxVisualPresetId } from './types'

export const sandboxAmounts = [64, 128, 256, 512, 1024, 2048, 4096] as const

export interface SandboxAlgorithm {
  id: string
  group:
    | 'Recommended'
    | 'Fast comparison sorts'
    | 'Distribution sorts'
    | 'Quadratic classics'
    | 'Network sorts'
    | 'Experimental'
  tags: string[]
  maximum: number
  powerOfTwo?: boolean
  workerKind:
    | 'quick'
    | 'merge'
    | 'heap'
    | 'radix'
    | 'counting'
    | 'shell'
    | 'bubble'
    | 'selection'
    | 'insertion'
    | 'bitonic'
}

export const sandboxAlgorithms: SandboxAlgorithm[] = [
  {
    id: 'quick-hoare',
    group: 'Recommended',
    tags: ['Recommended', 'Audio-friendly'],
    maximum: 4096,
    workerKind: 'quick',
  },
  {
    id: 'merge',
    group: 'Recommended',
    tags: ['Recommended', 'Visual-friendly'],
    maximum: 4096,
    workerKind: 'merge',
  },
  {
    id: 'heap',
    group: 'Recommended',
    tags: ['Recommended', 'Audio-friendly'],
    maximum: 4096,
    workerKind: 'heap',
  },
  {
    id: 'radix-lsd',
    group: 'Recommended',
    tags: ['Recommended', 'High throughput'],
    maximum: 4096,
    workerKind: 'radix',
  },
  {
    id: 'quick',
    group: 'Fast comparison sorts',
    tags: ['Audio-friendly'],
    maximum: 4096,
    workerKind: 'quick',
  },
  {
    id: 'merge-bottom-up',
    group: 'Fast comparison sorts',
    tags: ['Visual-friendly'],
    maximum: 4096,
    workerKind: 'merge',
  },
  {
    id: 'shell',
    group: 'Fast comparison sorts',
    tags: ['Visual-friendly'],
    maximum: 2048,
    workerKind: 'shell',
  },
  {
    id: 'counting',
    group: 'Distribution sorts',
    tags: ['High throughput'],
    maximum: 4096,
    workerKind: 'counting',
  },
  {
    id: 'bubble-optimized',
    group: 'Quadratic classics',
    tags: ['High event count', 'Size restricted'],
    maximum: 512,
    workerKind: 'bubble',
  },
  {
    id: 'selection',
    group: 'Quadratic classics',
    tags: ['High event count', 'Size restricted'],
    maximum: 512,
    workerKind: 'selection',
  },
  {
    id: 'insertion',
    group: 'Quadratic classics',
    tags: ['Audio-friendly', 'Size restricted'],
    maximum: 512,
    workerKind: 'insertion',
  },
  {
    id: 'bitonic',
    group: 'Network sorts',
    tags: ['Visual-friendly', 'Power-of-two required'],
    maximum: 4096,
    powerOfTwo: true,
    workerKind: 'bitonic',
  },
]

export const excludedSandboxAlgorithms = ['bogo', 'slow', 'stooge'] as const

export function isPowerOfTwo(value: number) {
  return value > 0 && (value & (value - 1)) === 0
}

export function sandboxAmountRestriction(algorithmId: string, amount: number) {
  const algorithm = sandboxAlgorithms.find((entry) => entry.id === algorithmId)
  if (!algorithm) return 'This algorithm is not available in the high-scale Sandbox pipeline.'
  if (amount > algorithm.maximum) {
    const name = algorithmById.get(algorithmId)?.name ?? algorithmId
    return `${name} is limited to ${algorithm.maximum.toLocaleString()} values because of its operation count.`
  }
  if (algorithm.powerOfTwo && !isPowerOfTwo(amount)) {
    return 'This sorting network requires a power-of-two amount.'
  }
  return null
}

export interface SandboxVisualPreset {
  id: SandboxVisualPresetId
  label: string
  background: string
  barLow: string
  barHigh: string
  active: string
  sorted: string
}

export const sandboxVisualPresets: Record<SandboxVisualPresetId, SandboxVisualPreset> = {
  classic: {
    id: 'classic',
    label: 'Classic',
    background: '#060b15',
    barLow: '#6f91bd',
    barHigh: '#e7f0fb',
    active: '#ffb84d',
    sorted: '#5eead4',
  },
  neon: {
    id: 'neon',
    label: 'Neon',
    background: '#030712',
    barLow: '#4f8cff',
    barHigh: '#b8d6ff',
    active: '#ff4fd8',
    sorted: '#50f3c8',
  },
  monochrome: {
    id: 'monochrome',
    label: 'Monochrome',
    background: '#090b0f',
    barLow: '#6b7280',
    barHigh: '#f8fafc',
    active: '#ffffff',
    sorted: '#cbd5e1',
  },
  heatmap: {
    id: 'heatmap',
    label: 'Heatmap',
    background: '#120805',
    barLow: '#f97316',
    barHigh: '#fde68a',
    active: '#ffffff',
    sorted: '#fb7185',
  },
  spectrum: {
    id: 'spectrum',
    label: 'Spectrum',
    background: '#050816',
    barLow: '#60a5fa',
    barHigh: '#c084fc',
    active: '#fde047',
    sorted: '#34d399',
  },
  terminal: {
    id: 'terminal',
    label: 'Terminal',
    background: '#020704',
    barLow: '#168445',
    barHigh: '#6ee7a0',
    active: '#d8ff85',
    sorted: '#ffffff',
  },
}

export const defaultSandboxPreferences: SandboxPreferences = {
  algorithm: 'quick-hoare',
  dataset: 'random',
  amount: 1024,
  speedMode: 'fast',
  visual: {
    preset: 'classic',
    gap: 0,
    widthMode: 'fit',
    activeBrightness: 1,
    trail: 0,
    backgroundStyle: 'vignette',
    showValues: false,
    showStatistics: true,
    showLegend: false,
    completionAnimation: true,
    quality: 'balanced',
    targetFps: 60,
  },
  audio: createAudioSettings('classic', { volume: 0.24 }),
}

export function completionSweepDuration(amount: number) {
  return Math.min(2200, Math.max(650, 450 + Math.sqrt(Math.max(1, amount)) * 22))
}

export function operationsPerFrame(mode: SandboxPreferences['speedMode'], targetFps: number) {
  const at60 = mode === 'realtime' ? 12 : mode === 'fast' ? 480 : 3200
  return Math.max(1, Math.round(at60 * (60 / Math.max(1, targetFps))))
}

export function estimateSandboxOperations(algorithmId: string, amount: number) {
  const algorithm = sandboxAlgorithms.find((entry) => entry.id === algorithmId)
  if (!algorithm) return amount
  if (['bubble', 'selection', 'insertion'].includes(algorithm.workerKind))
    return amount * amount * 0.62
  if (algorithm.workerKind === 'radix' || algorithm.workerKind === 'counting') return amount * 5
  if (algorithm.workerKind === 'bitonic') return amount * Math.log2(amount) ** 2 * 0.65
  return amount * Math.log2(Math.max(2, amount)) * 2.6
}
