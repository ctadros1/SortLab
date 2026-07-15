import { createAudioSettings, soundPresets } from '../audio/presets'
import type { SandboxPreferences } from './types'
import { defaultSandboxPreferences, sandboxAlgorithms, sandboxVisualPresets } from './config'

export const SANDBOX_PREFERENCES_KEY = 'sortlab-sandbox-v1'

interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export function loadSandboxPreferences(storage?: StorageLike): SandboxPreferences {
  if (!storage) return structuredClone(defaultSandboxPreferences)
  try {
    const parsed = JSON.parse(
      storage.getItem(SANDBOX_PREFERENCES_KEY) ?? '{}',
    ) as Partial<SandboxPreferences>
    const algorithm = sandboxAlgorithms.some((entry) => entry.id === parsed.algorithm)
      ? parsed.algorithm!
      : defaultSandboxPreferences.algorithm
    const visual = { ...defaultSandboxPreferences.visual, ...parsed.visual }
    if (!(visual.preset in sandboxVisualPresets)) visual.preset = 'classic'
    const presetId =
      parsed.audio?.id && parsed.audio.id in soundPresets ? parsed.audio.id : 'classic'
    return {
      ...defaultSandboxPreferences,
      ...parsed,
      algorithm,
      visual,
      audio: createAudioSettings(presetId, parsed.audio),
    }
  } catch {
    return structuredClone(defaultSandboxPreferences)
  }
}

export function saveSandboxPreferences(preferences: SandboxPreferences, storage?: StorageLike) {
  storage?.setItem(SANDBOX_PREFERENCES_KEY, JSON.stringify(preferences))
}
