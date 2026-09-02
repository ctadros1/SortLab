import { useId, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { AppIcon } from './Icon'

const shortcuts = [
  ['Space', 'Play or pause'],
  ['R', 'Reset'],
  ['S', 'Shuffle'],
  ['M', 'Mute'],
  ['H', 'Hide controls'],
  ['F', 'Fullscreen'],
  ['↑ / ↓', 'Change pace'],
] as const

export function SandboxShortcutTip() {
  const id = useId().replace(/:/g, '')
  const [style, setStyle] = useState<CSSProperties | null>(null)

  const show = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect()
    const width = Math.min(340, window.innerWidth - 24)
    setStyle({
      position: 'fixed',
      left: Math.min(window.innerWidth - width / 2 - 12, Math.max(width / 2 + 12, rect.left)),
      top: rect.top - 10,
      width,
      transform: 'translate(-50%, -100%)',
    })
  }

  return (
    <div className="sandbox-shortcut-tip">
      <button
        type="button"
        aria-describedby={style ? id : undefined}
        aria-expanded={Boolean(style)}
        onMouseEnter={(event) => show(event.currentTarget)}
        onMouseLeave={() => setStyle(null)}
        onFocus={(event) => show(event.currentTarget)}
        onBlur={() => setStyle(null)}
        onClick={(event) => show(event.currentTarget)}
      >
        <AppIcon name="keyboard" aria-hidden="true" />
        <span>Keyboard shortcuts</span>
        <small>Press or hover</small>
      </button>
      {style && typeof document !== 'undefined'
        ? createPortal(
            <aside className="sandbox-shortcut-popover" id={id} role="tooltip" style={style}>
              <span className="sandbox-shortcut-popover__heading">
                <AppIcon name="keyboard" aria-hidden="true" />
                <span>
                  <strong>Keyboard controls</strong>
                  <small>Keep your hands on the keyboard while a sort runs.</small>
                </span>
              </span>
              <span className="sandbox-shortcut-popover__grid">
                {shortcuts.map(([key, action]) => (
                  <span key={key}>
                    <kbd>{key}</kbd>
                    <span>{action}</span>
                  </span>
                ))}
              </span>
            </aside>,
            document.fullscreenElement ?? document.body,
          )
        : null}
    </div>
  )
}
