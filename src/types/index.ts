export type SortEventType =
  | 'compare'
  | 'swap'
  | 'write'
  | 'select'
  | 'pivot'
  | 'range'
  | 'merge'
  | 'heapify'
  | 'bucket'
  | 'markSorted'
  | 'note'

export interface SortStats {
  comparisons: number
  swaps: number
  writes: number
  reads: number
  auxiliary: number
  recursionDepth: number
  maxRecursionDepth: number
}

export interface SortEvent {
  type: SortEventType
  array: number[]
  indices: number[]
  codeLine: string
  narration: string
  stats: SortStats
  phase: string
  activeRange?: [number, number]
}

export type AlgorithmFamily =
  | 'Exchange'
  | 'Selection'
  | 'Insertion'
  | 'Merge'
  | 'Partition'
  | 'Heap'
  | 'Distribution'
  | 'Network'
  | 'Hybrid'
  | 'Novelty'

export interface AlgorithmMeta {
  id: string
  name: string
  aliases: string[]
  family: AlgorithmFamily
  shortDescription: string
  centralIdea: string
  steps: string[]
  example: string
  complexity: { best: string; average: string; worst: string; space: string }
  stable: boolean
  inPlace: boolean
  adaptive: boolean
  comparisonBased: boolean
  useCases: string
  disadvantages: string
  related: string
  avoidWhen: string
  implementationNotes: string
  studentMistakes: string
  restrictions: string
  recommendedMax: number
  hardMax: number
  warning?: string
  approximation?: boolean
  pseudocode: Array<{ id: string; text: string; explanation: string }>
}

export type DatasetMode =
  | 'random'
  | 'nearly-sorted'
  | 'reversed'
  | 'sorted'
  | 'few-unique'
  | 'duplicates'
  | 'sawtooth'
  | 'groups'
  | 'custom'

export type PlaybackStatus = 'idle' | 'running' | 'paused' | 'complete'
