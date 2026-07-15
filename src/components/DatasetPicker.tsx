import type { DatasetMode } from '../types'
import { getDatasetOptions } from '../ui/pickerOptions'
import { AppIcon, DatasetIcon } from './Icon'
import { RichCombobox } from './RichCombobox'

function DatasetPreview({ values }: { values: number[] }) {
  const maximum = Math.max(...values)
  return (
    <span className="dataset-preview" aria-hidden="true">
      {values.map((value, index) => (
        <i style={{ height: `${Math.max(20, (value / maximum) * 100)}%` }} key={index} />
      ))}
    </span>
  )
}

interface Props {
  value: DatasetMode
  onChange: (value: DatasetMode) => void
  disabled?: boolean
}

export function DatasetPicker({ value, onChange, disabled }: Props) {
  return (
    <RichCombobox
      label="Dataset"
      value={value}
      options={getDatasetOptions()}
      onChange={(next) => onChange(next as DatasetMode)}
      disabled={disabled}
      prominent
      searchPlaceholder="Search dataset patterns"
      renderSelected={(option) => (
        <span className="picker-selection">
          <span className="picker-icon picker-icon--dataset" aria-hidden="true">
            <DatasetIcon name={option.dataset.icon} />
          </span>
          <span>
            <strong>{option.dataset.name}</strong>
            <small>{option.dataset.description}</small>
          </span>
        </span>
      )}
      renderOption={(option, selected) => (
        <span className="dataset-option">
          <DatasetPreview values={option.dataset.preview} />
          <span className="dataset-option__copy">
            <span>
              <DatasetIcon name={option.dataset.icon} aria-hidden="true" size={16} />
              <strong>{option.dataset.name}</strong>
              {selected ? <AppIcon name="check" aria-hidden="true" size={15} /> : null}
            </span>
            <small>{option.dataset.description}</small>
          </span>
        </span>
      )}
    />
  )
}
