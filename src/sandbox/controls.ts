export type SandboxShortcutAction =
  | 'toggle-playback'
  | 'reset'
  | 'shuffle'
  | 'mute'
  | 'toggle-interface'
  | 'fullscreen'
  | 'faster'
  | 'slower'
  | 'restore-interface'
  | null

export function sandboxShortcutAction(
  key: string,
  code = '',
  interfaceHidden = false,
): SandboxShortcutAction {
  if (code === 'Space') return 'toggle-playback'
  const normalized = key.toLowerCase()
  if (normalized === 'r') return 'reset'
  if (normalized === 's') return 'shuffle'
  if (normalized === 'm') return 'mute'
  if (normalized === 'h') return 'toggle-interface'
  if (normalized === 'f') return 'fullscreen'
  if (key === 'ArrowUp') return 'faster'
  if (key === 'ArrowDown') return 'slower'
  if (key === 'Escape' && interfaceHidden) return 'restore-interface'
  return null
}

export function nextHiddenInterface(hidden: boolean, action: SandboxShortcutAction) {
  if (action === 'toggle-interface') return !hidden
  if (action === 'restore-interface') return false
  return hidden
}
