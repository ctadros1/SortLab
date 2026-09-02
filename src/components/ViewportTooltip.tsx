import { useId, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface TooltipPosition {
  style: CSSProperties
  placement: 'above' | 'below' | 'left'
}

interface Props {
  label: string
  children: ReactNode
  placement?: 'auto' | 'left'
}

function floatingRoot() {
  return document.fullscreenElement ?? document.body
}

export function ViewportTooltip({ label, children, placement = 'auto' }: Props) {
  const id = useId().replace(/:/g, '')
  const [position, setPosition] = useState<TooltipPosition | null>(null)

  const show = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect()
    const viewportPadding = 12
    if (placement === 'left') {
      setPosition({
        placement: 'left',
        style: {
          top: rect.top + rect.height / 2,
          left: Math.max(viewportPadding + 180, rect.left - 9),
          transform: 'translate(-100%, -50%)',
        },
      })
      return
    }
    const placeAbove = rect.top >= 58
    const left = Math.min(
      window.innerWidth - viewportPadding - 90,
      Math.max(viewportPadding + 90, rect.left + rect.width / 2),
    )
    setPosition({
      placement: placeAbove ? 'above' : 'below',
      style: {
        top: placeAbove ? rect.top - 9 : rect.bottom + 9,
        left,
        transform: placeAbove ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
      },
    })
  }

  return (
    <span
      className="viewport-tooltip-anchor"
      onMouseEnter={(event) =>
        show((event.currentTarget.firstElementChild as HTMLElement | null) ?? event.currentTarget)
      }
      onMouseLeave={() => setPosition(null)}
      onFocusCapture={(event) =>
        show((event.currentTarget.firstElementChild as HTMLElement | null) ?? event.currentTarget)
      }
      onBlurCapture={() => setPosition(null)}
    >
      {children}
      {position && typeof document !== 'undefined'
        ? createPortal(
            <span
              className={`viewport-tooltip viewport-tooltip--${position.placement}`}
              id={id}
              role="tooltip"
              style={position.style}
            >
              {label}
            </span>,
            floatingRoot(),
          )
        : null}
    </span>
  )
}
