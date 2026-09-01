import {
  generateSandboxArray,
  sandboxDatasetRegistry,
  type SandboxDatasetId,
} from '../sandbox/datasets'
import type { RichOption } from '../ui/combobox'
import { AppIcon } from './Icon'
import { DatasetPreview } from './DatasetPicker'
import { RichCombobox } from './RichCombobox'

interface SandboxDatasetOption extends RichOption {
  dataset: {
    id: SandboxDatasetId
    name: string
    description: string
    preview: number[]
  }
}

function datasetGroup(index: number) {
  if (index < 8) return 'Common datasets'
  if (index < 18) return 'Shapes and distributions'
  if (index < 25) return 'Algorithm stress tests'
  return 'Value ranges and duplicates'
}

const options: SandboxDatasetOption[] = sandboxDatasetRegistry.map(
  ([id, name, description], index) => ({
    id,
    name,
    group: datasetGroup(index),
    searchText: `${name} ${description}`,
    dataset: {
      id,
      name,
      description,
      preview: generateSandboxArray(id, 12, 42),
    },
  }),
)

interface Props {
  value: SandboxDatasetId
  onChange: (value: SandboxDatasetId) => void
  disabled?: boolean
}

export function SandboxDatasetPicker({ value, onChange, disabled }: Props) {
  return (
    <RichCombobox
      label="Dataset"
      value={value}
      options={options}
      onChange={(next) => onChange(next as SandboxDatasetId)}
      disabled={disabled}
      prominent={false}
      portal
      searchPlaceholder="Search Sandbox datasets"
      renderSelected={(option) => (
        <span className="sandbox-dataset-selection">
          <DatasetPreview values={option.dataset.preview} />
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
