import { useId, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { AppIcon } from './Icon'

interface Props {
  message: string
}

interface TooltipPosition {
  style: CSSProperties
}

export function AlgorithmCautionTooltip({ message }: Props) {
  const id = useId().replace(/:/g, '')
  const [position, setPosition] = useState<TooltipPosition | null>(null)

  const show = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect()
    const halfWidth = Math.min(160, Math.max(110, window.innerWidth / 2 - 16))
    const placeAbove = window.innerHeight - rect.bottom < 120 && rect.top > 120
    setPosition({
      style: {
        top: placeAbove ? rect.top - 9 : rect.bottom + 9,
        left: Math.min(
          window.innerWidth - halfWidth,
          Math.max(halfWidth, rect.left + rect.width / 2),
        ),
        transform: placeAbove ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
      },
    })
  }

  return (
    <>
      <span
        className="algorithm-option__caution"
        role="img"
        aria-label={`Important: ${message}`}
        aria-describedby={position ? id : undefined}
        onMouseEnter={(event) => show(event.currentTarget)}
        onMouseLeave={() => setPosition(null)}
        onPointerDown={(event) => {
          event.preventDefault()
          event.stopPropagation()
        }}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          show(event.currentTarget)
        }}
      >
        <AppIcon name="warning" aria-hidden="true" size={15} />
      </span>
      {position && typeof document !== 'undefined'
        ? createPortal(
            <span
              className="algorithm-option__tooltip"
              id={id}
              role="tooltip"
              style={position.style}
            >
              {message}
            </span>,
            document.fullscreenElement ?? document.body,
          )
        : null}
    </>
  )
}
