import type { AudioSettings } from '../audio/audioTypes'
import type { SandboxDatasetId } from './datasets'

export type SandboxSpeedMode = 'realtime' | 'fast' | 'maximum'
export type SandboxVisualPresetId =
  'classic' | 'neon' | 'monochrome' | 'heatmap' | 'spectrum' | 'terminal'
export type SandboxQuality = 'performance' | 'balanced' | 'high'
export type SandboxWidthMode = 'fit' | 'pixel' | 'dense'
export type SandboxBackgroundStyle = 'solid' | 'vignette'

export interface SandboxVisualSettings {
  preset: SandboxVisualPresetId
  gap: number
  widthMode: SandboxWidthMode
  activeBrightness: number
  trail: number
  backgroundStyle: SandboxBackgroundStyle
  showValues: boolean
  showStatistics: boolean
  showLegend: boolean
  completionAnimation: boolean
  quality: SandboxQuality
  targetFps: 30 | 60
}

export interface SandboxPreferences {
  algorithm: string
  dataset: SandboxDatasetId
  amount: number
  speedMode: SandboxSpeedMode
  visual: SandboxVisualSettings
  audio: AudioSettings
}

export type SandboxStatus = 'idle' | 'running' | 'paused' | 'complete' | 'error'

export interface SandboxStats {
  comparisons: number
  swaps: number
  writes: number
  operations: number
  operationsPerSecond: number
  elapsedMs: number
  progress: number
  fps: number
  queueSize: number
  audioVoices: number
}

export type SandboxOperation =
  | [type: 0, left: number, right: number]
  | [type: 1, left: number, right: number]
  | [type: 2, index: number, value: number]
  | [type: 3, index: number, pivotValue: number]
  | [type: 4, start: number, end: number]
