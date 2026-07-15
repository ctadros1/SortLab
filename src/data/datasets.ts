import type { DatasetMeta, DatasetMode } from '../types'

export const datasetRegistry: DatasetMeta[] = [
  {
    id: 'random',
    name: 'Random',
    description: 'An uneven mix with no intentional order.',
    icon: 'random',
    preview: [3, 8, 2, 7, 5, 9],
    searchTerms: ['mixed', 'shuffle', 'unsorted'],
  },
  {
    id: 'nearly-sorted',
    name: 'Nearly sorted',
    description: 'Mostly ordered with a few misplaced values.',
    icon: 'nearly-sorted',
    preview: [2, 4, 8, 6, 10, 12],
    searchTerms: ['almost', 'adaptive', 'few swaps'],
  },
  {
    id: 'reversed',
    name: 'Reversed',
    description: 'Descending values challenge poor pivot and scan choices.',
    icon: 'reversed',
    preview: [12, 10, 8, 6, 4, 2],
    searchTerms: ['descending', 'backwards', 'worst case'],
  },
  {
    id: 'sorted',
    name: 'Already sorted',
    description: 'Ascending values reveal adaptive early exits.',
    icon: 'sorted',
    preview: [2, 4, 6, 8, 10, 12],
    searchTerms: ['ascending', 'ordered', 'best case'],
  },
  {
    id: 'few-unique',
    name: 'Few unique values',
    description: 'A small value vocabulary repeated across the array.',
    icon: 'few-unique',
    preview: [4, 8, 4, 8, 12, 4],
    searchTerms: ['small range', 'repeated values'],
  },
  {
    id: 'duplicates',
    name: 'Many duplicates',
    description: 'Clusters of equal values expose stability behavior.',
    icon: 'duplicates',
    preview: [4, 4, 8, 8, 8, 12],
    searchTerms: ['equal', 'stable', 'repeated'],
  },
  {
    id: 'sawtooth',
    name: 'Sawtooth',
    description: 'A repeating staircase creates regular local inversions.',
    icon: 'sawtooth',
    preview: [2, 5, 8, 2, 5, 8],
    searchTerms: ['pattern', 'staircase', 'periodic'],
  },
  {
    id: 'groups',
    name: 'Shuffled groups',
    description: 'Ordered chunks appear in an intentionally mixed order.',
    icon: 'groups',
    preview: [8, 10, 2, 4, 12, 14],
    searchTerms: ['runs', 'chunks', 'blocks'],
  },
  {
    id: 'custom',
    name: 'Custom input',
    description: 'Enter your own comma-separated safe integers.',
    icon: 'custom',
    preview: [3, 6, 9, 5, 8, 11],
    searchTerms: ['manual', 'edit', 'integers'],
    constraints: 'Between 5 and 120 safe integers.',
  },
]

export const datasetById = new Map<DatasetMode, DatasetMeta>(
  datasetRegistry.map((dataset) => [dataset.id, dataset]),
)

export function searchDatasets(query: string, datasets = datasetRegistry) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return datasets
  return datasets.filter((dataset) =>
    [dataset.name, dataset.description, ...dataset.searchTerms]
      .join(' ')
      .toLowerCase()
      .includes(normalized),
  )
}
