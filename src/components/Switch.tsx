import type { ReactNode } from 'react'
import { nextSwitchState } from '../ui/visualizer'

interface Props {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  icon?: ReactNode
  description?: string
  disabled?: boolean
}

export function Switch({ checked, onChange, label, icon, description, disabled }: Props) {
  return (
    <div
      className={`switch-control ${icon ? '' : 'switch-control--plain'} ${disabled ? 'is-disabled' : ''}`}
    >
      {icon ? (
        <span className="switch-control__icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span className="switch-control__copy">
        <strong>{label}</strong>
        {description ? <small>{description}</small> : null}
      </span>
      <button
        type="button"
        className="switch-control__button"
        role="switch"
        aria-checked={checked}
        aria-label={`${label}: ${checked ? 'on' : 'off'}`}
        disabled={disabled}
        onClick={() => onChange(nextSwitchState(checked))}
      >
        <span aria-hidden="true" />
        <span className="sr-only">{checked ? 'On' : 'Off'}</span>
      </button>
    </div>
  )
}
