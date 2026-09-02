import { sandboxAlgorithms } from '../sandbox/config'
import type { RichOption } from '../ui/combobox'
import { AlgorithmIcon, AppIcon } from './Icon'
import { RichCombobox } from './RichCombobox'

interface SandboxAlgorithmOption extends RichOption {
  sandbox: (typeof sandboxAlgorithms)[number]
}

function amountLimitLabel(sandbox: SandboxAlgorithmOption['sandbox']) {
  return sandbox.exactAmount
    ? `Exactly ${sandbox.exactAmount.toLocaleString()}`
    : `Max ${sandbox.maximum.toLocaleString()}`
}

function getOptions(): SandboxAlgorithmOption[] {
  return sandboxAlgorithms.flatMap((sandbox) => {
    return [
      {
        id: sandbox.id,
        name: sandbox.name,
        group: sandbox.group,
        searchText: [
          sandbox.name,
          sandbox.group,
          sandbox.description,
          sandbox.implementationNote,
          ...sandbox.aliases,
          ...sandbox.tags,
        ].join(' '),
        sandbox,
      },
    ]
  })
}

interface Props {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function SandboxAlgorithmPicker({ value, onChange, disabled }: Props) {
  return (
    <RichCombobox
      label="Sandbox algorithm"
      value={value}
      options={getOptions()}
      onChange={onChange}
      disabled={disabled}
      prominent={false}
      portal
      searchPlaceholder="Search Sandbox algorithms"
      renderSelected={(option) => (
        <span className="picker-selection sandbox-picker-selection">
          <span className="picker-icon" aria-hidden="true">
            <AlgorithmIcon name={option.sandbox.icon} />
          </span>
          <span className="sandbox-picker-selection__copy">
            <strong>{option.sandbox.name}</strong>
            <small title={option.sandbox.implementationNote}>
              {option.sandbox.tags.slice(0, 2).join(' · ')}
            </small>
          </span>
          <i className="sandbox-picker-selection__limit">{amountLimitLabel(option.sandbox)}</i>
        </span>
      )}
      renderOption={(option, selected) => (
        <span className="algorithm-option">
          <span className="picker-icon" aria-hidden="true">
            <AlgorithmIcon name={option.sandbox.icon} />
          </span>
          <span className="algorithm-option__copy">
            <span className="algorithm-option__title">
              <strong>{option.sandbox.name}</strong>
              <i className="sandbox-algorithm-limit">{amountLimitLabel(option.sandbox)}</i>
              {selected ? <AppIcon name="check" aria-hidden="true" size={15} /> : null}
            </span>
            <small>{option.sandbox.description}</small>
            <span className="algorithm-option__badges">
              {option.sandbox.tags.map((tag, index) => (
                <i key={tag} title={index === 0 ? option.sandbox.implementationNote : undefined}>
                  {tag}
                </i>
              ))}
            </span>
          </span>
        </span>
      )}
    />
  )
}
