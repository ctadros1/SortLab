import type { DatasetMode } from '../types'
import { getDatasetOptions } from '../ui/pickerOptions'
import { AppIcon } from './Icon'
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
  portal?: boolean
}

export function DatasetPicker({ value, onChange, disabled, portal = false }: Props) {
  return (
    <RichCombobox
      label="Dataset"
      value={value}
      options={getDatasetOptions()}
      onChange={(next) => onChange(next as DatasetMode)}
      disabled={disabled}
      prominent
      portal={portal}
      searchable={false}
      renderSelected={(option) => (
        <span className="picker-selection picker-selection--text-only">
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
            <span className="dataset-option__title">
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
