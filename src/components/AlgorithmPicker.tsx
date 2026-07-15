import { familyLabels } from '../algorithms/registry'
import { getAlgorithmOptions } from '../ui/pickerOptions'
import { AlgorithmIcon, AppIcon } from './Icon'
import { RichCombobox } from './RichCombobox'

interface Props {
  value: string
  values: number[]
  onChange: (value: string) => void
  disabled?: boolean
  prominent?: boolean
  label?: string
}

export function AlgorithmPicker({
  value,
  values,
  onChange,
  disabled,
  prominent = true,
  label = 'Algorithm',
}: Props) {
  return (
    <RichCombobox
      label={label}
      value={value}
      options={getAlgorithmOptions(values)}
      onChange={onChange}
      disabled={disabled}
      prominent={prominent}
      searchPlaceholder="Search name, alias, or family"
      renderSelected={(option) => (
        <span className="picker-selection">
          <span className={`picker-icon picker-icon--accent-${option.accent}`} aria-hidden="true">
            <AlgorithmIcon name={option.algorithm.icon} />
          </span>
          <span>
            <strong>{option.algorithm.name}</strong>
            <small>{familyLabels[option.algorithm.family]}</small>
          </span>
        </span>
      )}
      renderOption={(option, selected) => (
        <span className="algorithm-option">
          <span className={`picker-icon picker-icon--accent-${option.accent}`} aria-hidden="true">
            <AlgorithmIcon name={option.algorithm.icon} />
          </span>
          <span className="algorithm-option__copy">
            <span className="algorithm-option__title">
              <strong>{option.algorithm.name}</strong>
              {option.algorithm.caution !== 'none' ? (
                <AppIcon name="warning" aria-hidden="true" size={15} />
              ) : null}
              {selected ? <AppIcon name="check" aria-hidden="true" size={15} /> : null}
            </span>
            <small>{option.algorithm.optionDescription}</small>
            <span className="algorithm-option__badges">
              <i>{option.algorithm.family}</i>
              {option.algorithm.badges.slice(0, 2).map((badge) => (
                <i key={badge}>{badge}</i>
              ))}
              <i>{option.algorithm.complexity.average}</i>
            </span>
          </span>
        </span>
      )}
    />
  )
}
