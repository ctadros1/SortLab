import type { AudioSettings, SoundPreset, SoundPresetId } from './audioTypes'

export const soundPresets: Record<SoundPresetId, SoundPreset> = {
  classic: {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional triangular sorting tones with balanced detail.',
    waveform: 'triangle',
    pitchMode: 'continuous',
    minimumFrequency: 120,
    maximumFrequency: 1212,
    envelope: { attack: 0.006, decay: 0.026, sustain: 0.34, release: 0.05, noteDuration: 0.07 },
    density: 'balanced',
    maxPolyphony: 12,
    gainScale: 0.78,
    events: { compare: true, swap: true, write: false, pivot: true, completion: true },
    autoGain: true,
  },
  soft: {
    id: 'soft',
    name: 'Soft',
    description: 'Gentler sine tones with a smoother release and lower ceiling.',
    waveform: 'sine',
    pitchMode: 'pentatonic',
    minimumFrequency: 110,
    maximumFrequency: 880,
    envelope: { attack: 0.012, decay: 0.04, sustain: 0.28, release: 0.09, noteDuration: 0.09 },
    density: 'balanced',
    maxPolyphony: 10,
    gainScale: 0.58,
    events: { compare: true, swap: true, write: false, pivot: false, completion: true },
    autoGain: true,
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    description: 'Sparse, quiet accents for long or high-speed runs.',
    waveform: 'triangle',
    pitchMode: 'chromatic',
    minimumFrequency: 140,
    maximumFrequency: 760,
    envelope: { attack: 0.004, decay: 0.014, sustain: 0.18, release: 0.028, noteDuration: 0.035 },
    density: 'sparse',
    maxPolyphony: 4,
    gainScale: 0.42,
    events: { compare: true, swap: true, write: false, pivot: false, completion: true },
    autoGain: true,
  },
}

export function createAudioSettings(
  preset: SoundPresetId = 'classic',
  overrides: Partial<AudioSettings> = {},
): AudioSettings {
  return { ...soundPresets[preset], enabled: true, volume: 0.28, ...overrides }
}

export const soundPresetList = Object.values(soundPresets)
