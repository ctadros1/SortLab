import { sandboxAlgorithms, sandboxAmountRestriction } from '../sandbox/config'
import type { AlgorithmIconId } from '../types'
import type { RichOption } from '../ui/combobox'
import { AlgorithmIcon, AppIcon } from './Icon'
import { RichCombobox } from './RichCombobox'

interface SandboxAlgorithmOption extends RichOption {
  sandbox: (typeof sandboxAlgorithms)[number]
}

const workerIcons: Record<(typeof sandboxAlgorithms)[number]['workerKind'], AlgorithmIconId> = {
  quick: 'partition',
  merge: 'merge',
  heap: 'heap',
  radix: 'digits',
  counting: 'buckets',
  shell: 'insertion',
  bubble: 'adjacent',
  selection: 'selection',
  insertion: 'insertion',
  bitonic: 'network',
}

function getOptions(amount: number): SandboxAlgorithmOption[] {
  return sandboxAlgorithms.flatMap((sandbox) => {
    const disabledReason = sandboxAmountRestriction(sandbox.id, amount)
    return [
      {
        id: sandbox.id,
        name: sandbox.name,
        group: sandbox.group,
        searchText: [
          sandbox.name,
          sandbox.group,
          sandbox.description,
          ...sandbox.aliases,
          ...sandbox.tags,
        ].join(' '),
        disabled: Boolean(disabledReason),
        disabledReason: disabledReason ?? undefined,
        sandbox,
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
            <AlgorithmIcon name={workerIcons[option.sandbox.workerKind]} />
          </span>
          <span>
            <strong>{option.sandbox.name}</strong>
            <small>{option.sandbox.tags.slice(0, 2).join(' · ')}</small>
          </span>
        </span>
      )}
      renderOption={(option, selected) => (
        <span className="algorithm-option">
          <span className="picker-icon" aria-hidden="true">
            <AlgorithmIcon name={workerIcons[option.sandbox.workerKind]} />
          </span>
          <span className="algorithm-option__copy">
            <span className="algorithm-option__title">
              <strong>{option.sandbox.name}</strong>
              {selected ? <AppIcon name="check" aria-hidden="true" size={15} /> : null}
            </span>
            <small>{option.sandbox.description}</small>
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
