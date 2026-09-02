import type { SortEventType } from '../types'

export type Waveform = OscillatorType
export type PitchMode = 'continuous' | 'chromatic' | 'pentatonic' | 'major'
export type SoundDensity = 'sparse' | 'balanced' | 'detailed'
export type SoundPresetId = 'classic' | 'soft' | 'minimal'
export type AudioOutputChannel = 'center' | 'first' | 'second'

export interface AdsrEnvelope {
  attack: number
  decay: number
  sustain: number
  release: number
  noteDuration: number
}

export interface SoundEventSettings {
  compare: boolean
  swap: boolean
  write: boolean
  pivot: boolean
  completion: boolean
}

export interface SoundPreset {
  id: SoundPresetId
  name: string
  description: string
  waveform: Waveform
  pitchMode: PitchMode
  minimumFrequency: number
  maximumFrequency: number
  envelope: AdsrEnvelope
  density: SoundDensity
  maxPolyphony: number
  gainScale: number
  events: SoundEventSettings
  autoGain: boolean
}

export interface AudioSettings extends SoundPreset {
  enabled: boolean
  volume: number
}

export interface SortSoundEvent {
  type: SortEventType | 'completion'
  values: number[]
  dataset: number[]
  speed: number
  sequence: number
}

export interface AudioDebugState {
  contextCreated: boolean
  contextState: AudioContextState | 'unavailable'
  activeVoices: number
  scheduledEvents: number
  droppedEvents: number
  outputGains: Record<AudioOutputChannel, number>
  outputPans: Record<AudioOutputChannel, number>
}
