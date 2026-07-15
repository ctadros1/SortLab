import { createAudioSettings, soundPresets } from './presets'
import type { AudioSettings, SoundPresetId } from './audioTypes'

export const VISUALIZE_AUDIO_KEY = 'sortlab-visualize-audio-v2'
export const SANDBOX_AUDIO_KEY = 'sortlab-sandbox-audio-v2'

interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export interface VisualizeAudioPreferences {
  enabled: boolean
  volume: number
  preset: SoundPresetId
}

export function loadVisualizeAudioPreferences(storage?: StorageLike): VisualizeAudioPreferences {
  const fallback = { enabled: true, volume: 0.28, preset: 'classic' as const }
  if (!storage) return fallback
  try {
    const parsed = JSON.parse(
      storage.getItem(VISUALIZE_AUDIO_KEY) ?? '{}',
    ) as Partial<VisualizeAudioPreferences>
    const preset = parsed.preset && parsed.preset in soundPresets ? parsed.preset : fallback.preset
    return {
      enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : fallback.enabled,
      volume:
        typeof parsed.volume === 'number'
          ? Math.min(1, Math.max(0, parsed.volume))
          : fallback.volume,
      preset,
    }
  } catch {
    return fallback
  }
}

export function saveVisualizeAudioPreferences(
  preferences: VisualizeAudioPreferences,
  storage?: StorageLike,
) {
  storage?.setItem(VISUALIZE_AUDIO_KEY, JSON.stringify(preferences))
}

export function loadSandboxAudioSettings(storage?: StorageLike) {
  const fallback = createAudioSettings('classic')
  if (!storage) return fallback
  try {
    const parsed = JSON.parse(storage.getItem(SANDBOX_AUDIO_KEY) ?? '{}') as Partial<AudioSettings>
    const preset = parsed.id && parsed.id in soundPresets ? parsed.id : 'classic'
    return createAudioSettings(preset, parsed)
  } catch {
    return fallback
  }
}

export function saveSandboxAudioSettings(settings: AudioSettings, storage?: StorageLike) {
  storage?.setItem(SANDBOX_AUDIO_KEY, JSON.stringify(settings))
}
