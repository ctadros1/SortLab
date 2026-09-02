import { createAudioSettings } from '../audio/presets'
import type { SandboxPreferences, SandboxVisualPresetId } from './types'
import { sandboxAlgorithms } from './catalog'

export {
  sandboxAlgorithms,
  sandboxExecutionLabels,
  type SandboxAlgorithm,
  type SandboxExecutionMode,
  type SandboxWorkerKind,
} from './catalog'

export const SANDBOX_MIN_AMOUNT = 16
export const SANDBOX_MAX_AMOUNT = 16384
export const sandboxAmounts = [16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384] as const

export const sandboxAlgorithmById = new Map(
  sandboxAlgorithms.map((algorithm) => [algorithm.id, algorithm]),
)

export function isPowerOfTwo(value: number) {
  return value > 0 && (value & (value - 1)) === 0
}

export function sandboxAmountRestriction(algorithmId: string, amount: number) {
  const algorithm = sandboxAlgorithmById.get(algorithmId)
  if (!algorithm) return 'This algorithm is not available in the high-scale Sandbox pipeline.'
  if (algorithm.exactAmount && amount !== algorithm.exactAmount) {
    return `${algorithm.name} uses a fixed schedule for exactly ${algorithm.exactAmount.toLocaleString()} values.`
  }
  if (amount > algorithm.maximum) {
    return `${algorithm.name} is limited to ${algorithm.maximum.toLocaleString()} values because of its operation count.`
  }
  if (algorithm.powerOfTwo && !isPowerOfTwo(amount)) {
    return 'This sorting network requires a power-of-two amount.'
  }
  return null
}

export function compatibleSandboxAmount(algorithmId: string, requestedAmount: number) {
  const algorithm = sandboxAlgorithmById.get(algorithmId)
  const maximum = Math.min(SANDBOX_MAX_AMOUNT, algorithm?.maximum ?? SANDBOX_MAX_AMOUNT)
  const clamped = Math.min(maximum, Math.max(SANDBOX_MIN_AMOUNT, Math.round(requestedAmount)))
  if (algorithm?.exactAmount) return algorithm.exactAmount
  if (!algorithm?.powerOfTwo) return clamped
  return 2 ** Math.floor(Math.log2(clamped))
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

export const sandboxLightVisualPalette: Omit<SandboxVisualPreset, 'id' | 'label'> = {
  background: '#f7f9fd',
  barLow: '#0b1b3a',
  barHigh: '#174f91',
  active: '#c66a05',
  sorted: '#047c6d',
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

export function sandboxOperationBudget(algorithmId: string, amount: number) {
  return Math.min(
    5_000_000,
    Math.max(25_000, Math.ceil(estimateSandboxOperations(algorithmId, amount) * 6)),
  )
}
