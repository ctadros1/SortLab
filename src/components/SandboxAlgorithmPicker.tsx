import { algorithmById } from '../algorithms/registry'
import { sandboxAlgorithms, sandboxAmountRestriction } from '../sandbox/config'
import type { RichOption } from '../ui/combobox'
import { AlgorithmIcon, AppIcon } from './Icon'
import { RichCombobox } from './RichCombobox'

interface SandboxAlgorithmOption extends RichOption {
  sandbox: (typeof sandboxAlgorithms)[number]
  algorithm: NonNullable<ReturnType<typeof algorithmById.get>>
}

function getOptions(amount: number): SandboxAlgorithmOption[] {
  return sandboxAlgorithms.flatMap((sandbox) => {
    const algorithm = algorithmById.get(sandbox.id)
    if (!algorithm) return []
    const disabledReason = sandboxAmountRestriction(sandbox.id, amount)
    return [
      {
        id: sandbox.id,
        name: algorithm.name,
        group: sandbox.group,
        searchText: [algorithm.name, algorithm.family, ...algorithm.aliases, ...sandbox.tags].join(
          ' ',
        ),
        disabled: Boolean(disabledReason),
        disabledReason: disabledReason ?? undefined,
        sandbox,
        algorithm,
      },
    ]
  })
}

interface Props {
  value: string
  amount: number
  onChange: (value: string) => void
  disabled?: boolean
}

export function SandboxAlgorithmPicker({ value, amount, onChange, disabled }: Props) {
  return (
    <RichCombobox
      label="Sandbox algorithm"
      value={value}
      options={getOptions(amount)}
      onChange={onChange}
      disabled={disabled}
      prominent={false}
      searchPlaceholder="Search Sandbox algorithms"
      renderSelected={(option) => (
        <span className="picker-selection sandbox-picker-selection">
          <span className="picker-icon" aria-hidden="true">
            <AlgorithmIcon name={option.algorithm.icon} />
          </span>
          <span>
            <strong>{option.algorithm.name}</strong>
            <small>{option.sandbox.tags.slice(0, 2).join(' · ')}</small>
          </span>
        </span>
      )}
      renderOption={(option, selected) => (
        <span className="algorithm-option">
          <span className="picker-icon" aria-hidden="true">
            <AlgorithmIcon name={option.algorithm.icon} />
          </span>
          <span className="algorithm-option__copy">
            <span className="algorithm-option__title">
              <strong>{option.algorithm.name}</strong>
              {selected ? <AppIcon name="check" aria-hidden="true" size={15} /> : null}
            </span>
            <small>{option.algorithm.optionDescription}</small>
            <span className="algorithm-option__badges">
              {option.sandbox.tags.map((tag) => (
                <i key={tag}>{tag}</i>
              ))}
            </span>
          </span>
        </span>
      )}
    />
  )
}
