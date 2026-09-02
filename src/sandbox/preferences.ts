import { createAudioSettings, soundPresets } from '../audio/presets'
import type { SandboxPreferences } from './types'
import { defaultSandboxPreferences, sandboxAlgorithms, sandboxVisualPresets } from './config'
import { sandboxDatasetRegistry } from './datasets'

const LEGACY_SANDBOX_PREFERENCES_KEY = 'sortlab-sandbox-v1'
export const SANDBOX_PREFERENCES_KEY = 'sortlab-sandbox-v2'

interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export function loadSandboxPreferences(storage?: StorageLike): SandboxPreferences {
  if (!storage) return structuredClone(defaultSandboxPreferences)
  try {
    const current = storage.getItem(SANDBOX_PREFERENCES_KEY)
    const legacy = current ? null : storage.getItem(LEGACY_SANDBOX_PREFERENCES_KEY)
    const parsed = JSON.parse(current ?? legacy ?? '{}') as Partial<SandboxPreferences>
    const algorithm = sandboxAlgorithms.some((entry) => entry.id === parsed.algorithm)
      ? parsed.algorithm!
      : defaultSandboxPreferences.algorithm
    const visual = { ...defaultSandboxPreferences.visual, ...parsed.visual }
    if (!(visual.preset in sandboxVisualPresets)) visual.preset = 'classic'
    const dataset = sandboxDatasetRegistry.some(([id]) => id === parsed.dataset)
      ? parsed.dataset!
      : defaultSandboxPreferences.dataset
    const presetId =
      parsed.audio?.id && parsed.audio.id in soundPresets ? parsed.audio.id : 'classic'
    return {
      ...defaultSandboxPreferences,
      ...parsed,
      algorithm,
      dataset,
      visual,
      audio: createAudioSettings(
        presetId,
        legacy && parsed.audio
          ? {
              ...parsed.audio,
              events: {
                ...createAudioSettings(presetId).events,
                ...parsed.audio.events,
                write: true,
              },
            }
          : parsed.audio,
      ),
    }
  } catch {
    return structuredClone(defaultSandboxPreferences)
  }
}

export function saveSandboxPreferences(preferences: SandboxPreferences, storage?: StorageLike) {
  storage?.setItem(SANDBOX_PREFERENCES_KEY, JSON.stringify(preferences))
}
