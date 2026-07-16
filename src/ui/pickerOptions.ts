import {
  familyLabels,
  validateAlgorithmInput,
  visualizeAlgorithmRegistry,
} from '../algorithms/registry'
import { datasetRegistry } from '../data/datasets'
import type { RichOption } from './combobox'

export interface AlgorithmOption extends RichOption {
  algorithm: (typeof visualizeAlgorithmRegistry)[number]
  accent: number
}

export function getAlgorithmOptions(values: number[]): AlgorithmOption[] {
  return visualizeAlgorithmRegistry.map((algorithm, index) => {
    const disabledReason = validateAlgorithmInput(algorithm.id, values)
    return {
      id: algorithm.id,
      name: algorithm.name,
      group: familyLabels[algorithm.family],
      searchText: [
        algorithm.name,
        algorithm.family,
        algorithm.shortDescription,
        ...algorithm.aliases,
        ...algorithm.searchTerms,
      ].join(' '),
      disabled: Boolean(disabledReason),
      disabledReason: disabledReason ?? undefined,
      algorithm,
      accent: index % 6,
    }
  })
}

export interface DatasetOption extends RichOption {
  dataset: (typeof datasetRegistry)[number]
}

export function getDatasetOptions(): DatasetOption[] {
  return datasetRegistry.map((dataset) => ({
    id: dataset.id,
    name: dataset.name,
    group: dataset.id === 'custom' ? 'Your data' : 'Generated datasets',
    searchText: [dataset.name, dataset.description, ...dataset.searchTerms].join(' '),
    dataset,
  }))
}
